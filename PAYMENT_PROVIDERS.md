# Proveedores de pago (Centro de Pagos) — Mi Consultorio Pro

## 1. Por qué un patrón adaptador

El sistema no está acoplado a una sola pasarela de pago. Toda integración de pago implementa la misma interfaz `PaymentProvider` (`lib/payments/types.ts`), y el resto del sistema (conciliación, reportes, estado de la cita) solo conoce el vocabulario interno común (`InternalPaymentStatus`, el enum `payment_status`), nunca el vocabulario específico de cada pasarela. Esto es una decisión de arquitectura explícita (`docs/00-ARQUITECTURA-Y-PLAN.md`, riesgo #10: "acoplamiento fuerte a una sola pasarela") para que cambiar o agregar una pasarela no implique reescribir reportes ni conciliación.

## 2. La interfaz `PaymentProvider`

```ts
interface PaymentProvider {
  readonly providerKey: string;
  readonly supportsAutomaticCheckout: boolean;

  createCheckoutSession?(input: CreateCheckoutInput): Promise<CheckoutSession>;
  getPaymentStatus?(externalReference: string): Promise<PaymentStatusResult>;
  validateWebhookSignature(payload: Record<string, unknown>, signatureHeader: string | null): boolean;
  handleWebhook(payload: Record<string, unknown>): Promise<WebhookResult>;
  mapExternalStatusToInternalStatus(externalStatus: string): InternalPaymentStatus;
  cancelPayment?(externalTransactionId: string): Promise<void>;
  refundPayment?(externalTransactionId: string, amount?: number): Promise<void>;
}
```

- `createCheckoutSession` y `getPaymentStatus` son **opcionales** porque los métodos sin checkout automático (transferencia manual, pago presencial) no los necesitan.
- `validateWebhookSignature` y `handleWebhook` son obligatorios en todo provider, incluso los que no reciben webhooks reales — para cumplir el contrato aunque su implementación sea trivial (ver §4).
- `mapExternalStatusToInternalStatus` es el punto único donde el vocabulario de cada pasarela se traduce al estado interno común: `pending`, `pending_confirmation`, `approved`, `rejected`, `cancelled`, `expired`, `refunded`, `partially_refunded`, `failed`, `manual_review` (enum `payment_status` en la base de datos).
- `cancelPayment` y `refundPayment` son opcionales porque no todos los métodos soportan cancelación/reembolso programático.

## 3. Providers implementados hoy

### Wompi (`lib/payments/providers/wompi.ts`) — pasarela automática real

- `supportsAutomaticCheckout = true`.
- `createCheckoutSession()` construye la URL de Wompi Web Checkout, firmando la integridad de la transacción (`reference + amountInCents + currency + integritySecret`, SHA-256) según el esquema documentado por Wompi.
- `getPaymentStatus()` consulta la API de transacciones de Wompi por referencia, usando la llave privada.
- `validateWebhookSignature()` valida la firma del evento con SHA-256 sobre las propiedades declaradas + timestamp + `eventsSecret`.
- `handleWebhook()` extrae `transaction.id`, `status` y `reference` del payload solo si la firma es válida.
- `mapExternalStatusToInternalStatus()`: `APPROVED → approved`, `DECLINED → rejected`, `VOIDED → cancelled`, `ERROR → failed`, `PENDING`/cualquier otro → `pending`.
- Incluye además `testConnection()` (no forma parte de la interfaz común) para la pantalla de "Prueba de conexión" al configurar las credenciales.
- Nota del propio código: la estructura de firma sigue la documentación pública de Wompi vigente al momento de escribirse — conviene reverificarla contra la documentación actual antes de salir a producción, por si la pasarela cambia el formato.

### Transferencia manual (`lib/payments/providers/manual-transfer.ts`)

- `supportsAutomaticCheckout = false`. No hay checkout ni webhook reales.
- El paciente transfiere por su cuenta y opcionalmente sube un comprobante (`manual_payment_proofs`).
- El staff del consultorio confirma manualmente desde `/dashboard/pagos/conciliacion`.
- `mapExternalStatusToInternalStatus()` siempre devuelve `pending_confirmation` — existe solo para cumplir el contrato de la interfaz.

### Pago presencial (`lib/payments/providers/in-person.ts`)

- `supportsAutomaticCheckout = false`. El paciente paga al llegar a la cita.
- Igual que transferencia manual: sin checkout ni webhook, `mapExternalStatusToInternalStatus()` devuelve `pending_confirmation`.

## 4. Providers preparados para el futuro (no implementados aún)

El check constraint de `payment_providers.provider_key` en la base de datos ya reserva las claves para pasarelas colombianas comunes, aunque su lógica de integración (`lib/payments/providers/*.ts`) todavía no existe:

- `mercado_pago` — Mercado Pago.
- `payu` — PayU.
- `epayco` — ePayco.
- `bold` — Bold.
- `placetopay` — PlaceToPay.

También existe la clave `external_link` en el modelo de datos, para pagos gestionados por un link externo generado fuera del sistema.

Agregar cualquiera de estos providers implica: crear una clase que implemente `PaymentProvider`, registrar su `provider_key` (ya permitido por la restricción de base de datos), y sumarla al selector del Centro de Pagos en `/dashboard/pagos` — sin tocar conciliación, reportes ni el resto del flujo de citas, gracias al patrón adaptador.

## 5. Credenciales por consultorio, no variables de entorno globales

Cada consultorio configura **sus propias credenciales** de pasarela desde el Centro de Pagos (`/dashboard/pagos`), guardadas cifradas (AES-256-GCM) en `payment_providers.encrypted_credentials` con `APP_ENCRYPTION_KEY` (ver `SECURITY.md`). Las variables de entorno `WOMPI_PUBLIC_KEY`/`WOMPI_PRIVATE_KEY`/`WOMPI_EVENTS_SECRET`/`WOMPI_INTEGRITY_SECRET` (`.env.example`) son **solo un fallback de sandbox para desarrollo local**, no una configuración global obligatoria para todos los consultorios en producción.

Solo el `clinic_owner` de cada clínica (o el `super_admin`) puede leer/gestionar `payment_providers` — reforzado por RLS (política `payment_providers_owner_only`); el resto del staff ve únicamente qué métodos están disponibles a través de la vista `payment_providers_public`, que nunca expone las credenciales.

## 6. Máquina de estados única

Independientemente del provider usado, todo pago transita por el mismo conjunto de estados internos (`payment_status`), lo que permite que reportes y conciliación funcionen igual sin importar si el consultorio cobra con Wompi, transferencia manual o presencial:

```
pending → pending_confirmation → approved | rejected | expired | refunded | partially_refunded | failed | manual_review
```

La expiración de un `payment_intent` sin confirmarse libera el horario reservado (pensado como job/Edge Function); un reembolso se registra también en `payment_reconciliation_logs` con quién lo ejecutó.

# Seguridad — Mi Consultorio Pro

Este documento describe los mecanismos de seguridad realmente implementados en el sistema al día de hoy, y señala explícitamente qué está en el roadmap y todavía no existe. No es una promesa de certificación ni un documento de cumplimiento formal (ISO 27001, SOC 2, etc.) — es una descripción honesta de la arquitectura de seguridad del producto.

## 1. Aislamiento multi-tenant (Row Level Security)

Mi Consultorio Pro es multi-tenant real: todos los consultorios comparten la misma base de datos Postgres (Supabase), y el aislamiento entre consultorios se aplica con **Row Level Security (RLS)** en cada tabla, no solo en la capa de aplicación. La regla de diseño explícita del proyecto es: *si RLS no lo protege, no está protegido* — la UI y las Server Actions son una segunda capa, nunca la única barrera.

Las políticas RLS de todas las tablas dependen de cuatro funciones `security definer` definidas en `supabase/migrations/20260704160000_core_tenant.sql`:

- `public.current_clinic_id()` — devuelve el `clinic_id` del usuario autenticado (leído de `profiles`).
- `public.current_role()` — devuelve el rol (`app_role`) del usuario autenticado.
- `public.is_super_admin()` — `true` si el rol es `super_admin` (acceso transversal a todas las clínicas).
- `public.current_professional_id()` — devuelve el `id` en `professionals` vinculado al perfil autenticado, usado para restringir a un profesional a sus propios pacientes/citas/pagos.

Toda tabla operativa exige `clinic_id = current_clinic_id()` (o `is_super_admin()`) en sus políticas. Ejemplos verificables en las migraciones: `clinics`, `professionals`, `patients`, `payment_intents`, `payments`, `consent_records`, `support_tickets`, `licenses`, `enabled_modules`, `notification_logs`, `backup_logs`.

Un usuario no puede escalar sus propios privilegios: el trigger `prevent_self_privilege_escalation` en `profiles` bloquea que alguien cambie su propio `role` o `clinic_id` directamente; la única vía para convertirse en `clinic_owner` de un consultorio nuevo es la función `create_clinic_and_assign_owner()` (`security definer`, invocada solo en el registro).

## 2. Separación de roles

El sistema define 8 roles (`lib/auth/roles.ts`, reflejado en el enum `app_role` de la base de datos):

| Rol | Alcance |
|---|---|
| `super_admin` | Fuera del tenant — panel `/admin`, acceso transversal a todos los consultorios |
| `clinic_owner` | Control total de su propio consultorio |
| `professional` | Agenda, pacientes y notas propias; reportes de sus propios pagos |
| `assistant` | Agenda operativa y datos administrativos de pacientes, sin acceso clínico ni financiero |
| `receptionist` | Igual que assistant + confirmación de pagos, sin reportes financieros completos |
| `finance_user` | Solo pagos/reportes financieros, sin acceso clínico |
| `support_agent` | Solo el sistema de tickets, transversal a todas las clínicas |
| `patient` | Su propio portal, sin acceso al panel del consultorio |

El tipo de práctica (`practitioner_type` — médico general, odontólogo, psicólogo, medicina alternativa, etc.) **no otorga permisos**: solo adapta lenguaje, plantillas y disclaimers. Los permisos reales están en `ROLE_PERMISSIONS` (`lib/auth/roles.ts`) y se aplican en dos capas, como exige el documento de arquitectura (`docs/00-ARQUITECTURA-Y-PLAN.md` §8):

1. **RLS en Postgres** — barrera dura por `clinic_id` + `role`.
2. **Guards en Server Actions/middleware** — capa de UX (ocultar botones, redirigir), nunca la única barrera.

Los datos clínicos (notas de paciente) están separados de los datos administrativos: `patient_documents.is_clinical` distingue documentos administrativos (visibles a asistente/recepcionista) de documentos clínicos (visibles solo al `clinic_owner` y al profesional tratante), aplicado en la política `patient_documents_select`.

## 3. Autenticación

Autenticación gestionada por Supabase Auth (`auth.users`). Al crear un usuario se genera automáticamente una fila en `public.profiles` (trigger `handle_new_user`) con rol y `clinic_id` según metadata de registro/invitación.

**Brecha conocida / roadmap: no hay autenticación de dos factores (2FA) implementada.** El login es usuario + contraseña gestionado por Supabase Auth, sin capa adicional de verificación. Activar 2FA (TOTP o similar) para roles con acceso a datos sensibles (`clinic_owner`, `professional`, `support_agent`, `super_admin`) es una mejora pendiente, no una funcionalidad actual del producto.

## 4. Almacenamiento (Storage)

Dos buckets definidos en `supabase/migrations/20260706120000_storage_buckets.sql`:

- **`branding`** (público) — logos, portada, foto profesional, credenciales públicas. Lectura pública; escritura solo del `clinic_owner` de la clínica dueña de la ruta (`(storage.foldername(name))[1] = current_clinic_id()`).
- **`clinical-documents`** (privado) — documentos de pacientes, comprobantes de pago manual. Lectura y escritura restringidas al staff de la misma clínica; el borrado solo a `clinic_owner`/`professional`. La convención de ruta usa el `clinic_id` como primer segmento del path, lo que permite aislar por RLS de Storage sin tabla intermedia.

La distinción "documento clínico vs. administrativo" se aplica en la fila de `patient_documents` (`is_clinical`), no en el bucket — cualquier miembro del staff con acceso al bucket puede leer el archivo si conoce la ruta; el filtro real de qué puede *listar* cada rol ocurre en la aplicación a partir de la tabla.

## 5. Cifrado de credenciales de pasarelas de pago

Las credenciales de cada pasarela de pago (Wompi u otras) que configura un consultorio se cifran antes de guardarse en `payment_providers.encrypted_credentials`:

- Algoritmo: **AES-256-GCM** (`lib/payments/crypto.ts`).
- Clave: `APP_ENCRYPTION_KEY`, hex de 32 bytes (`openssl rand -hex 32`), variable de entorno solo de servidor.
- El payload cifrado guarda `iv` (12 bytes) + `authTag` (16 bytes) + texto cifrado, codificado en base64.
- `decryptCredentials()` solo puede invocarse desde código de servidor (`import "server-only"`), nunca desde el navegador.
- La tabla `payment_providers` **no tiene política de lectura para ningún rol de clínica vía RLS** salvo `clinic_owner` de esa misma clínica o `super_admin` (política `payment_providers_owner_only`); para mostrar "métodos disponibles" sin exponer credenciales existe la vista `payment_providers_public`, que nunca incluye la columna cifrada.

Si `APP_ENCRYPTION_KEY` no está definida o no tiene el largo correcto, `encryptCredentials`/`decryptCredentials` lanzan una excepción explícita en vez de degradar silenciosamente a texto plano.

## 6. Auditoría

Existe la tabla `audit_logs` (`clinic_id`, `actor_profile_id`, `action`, `entity_type`, `entity_id`, `before_data`, `after_data`, `ip_address`, `user_agent`), de solo lectura para `clinic_owner`/`super_admin` vía RLS. La escritura ocurre siempre desde el servidor con el cliente admin (`lib/security/audit.ts`, función `logAudit()`), nunca desde el navegador — no hay política de `insert` para `anon`/`authenticated`.

A día de hoy se escribe en `audit_logs` desde las acciones de mayor riesgo: configuración/activación de credenciales de pasarela de pago (`dashboard/pagos/actions.ts`) y borrado lógico de pacientes (`dashboard/pacientes/actions.ts`). **No todas las mutaciones sensibles del sistema escriben auditoría todavía** — es una cobertura inicial, no exhaustiva; ampliarla (cambios de rol de staff, edición de consentimientos, cambios de licencia) queda como trabajo pendiente.

El módulo clínico protegido tiene su propia auditoría, más granular: `clinical_notes_access_logs` registra cada `view`/`edit` de una nota clínica, con quién la vio, escrito automáticamente al abrir o guardar una nota (`app/(app)/dashboard/clinico/[patientId]/`), de solo lectura para `clinic_owner`/`super_admin`.

Adicionalmente existen registros de auditoría específicos de dominio:
- `payment_webhooks` — cada evento crudo recibido de una pasarela, se valide o no su firma (`signature_valid`).
- `payment_reconciliation_logs` — cada acción de conciliación manual (`confirmed`, `rejected`, `marked_review`, `refunded`, `exported`) con quién la ejecutó.
- `consent_records` — evidencia de aceptación de consentimientos con `ip_address`, `user_agent`, versión del documento aceptada.
- `notification_logs` — auditoría de cada envío de recordatorio/notificación.

## 7. Validación de webhooks de pago

Cada implementación de `PaymentProvider` expone `validateWebhookSignature()`. Para Wompi (`lib/payments/providers/wompi.ts`), la firma se valida con SHA-256 sobre las propiedades declaradas por el evento + timestamp + `eventsSecret`, replicando el esquema documentado de Wompi. Los eventos se deduplican por `(provider_key, external_event_id)` con un índice único en `payment_webhooks`, para evitar procesar el mismo webhook dos veces.

## 8. Rate limiting

Implementado con un contador propio en Postgres (`rate_limit_attempts`, evaluado desde `lib/security/rate-limit.ts`), sin dependencias externas — cada llamada cuenta intentos por clave (IP, email, o combinación) en una ventana de tiempo y bloquea si se supera el máximo:

- **Login** (`app/login/actions.ts`): máx. 15 intentos por IP cada 5 minutos, y máx. 6 intentos por email cada 15 minutos (protege una cuenta específica aunque el atacante rote de IP).
- **Registro** (`app/register/actions.ts`): máx. 5 registros por IP cada hora.
- **Reserva pública** (`app/c/[slug]/reservar/[serviceId]/actions.ts`): máx. 15 intentos de reserva por IP cada hora.

**Limitación conocida:** al estar basado en Postgres (no Redis), añade una consulta y un insert por verificación — suficiente para el volumen esperado de un consultorio individual, pero no pensado para escalar a tráfico masivo. Si el producto crece a un volumen alto de tráfico público, migrar a Upstash Redis (`@upstash/ratelimit`) es la mejora recomendada. El identificador de cliente usa `x-forwarded-for`, confiable en Vercel pero falsificable si la app se despliega detrás de un proxy que no lo controle.

## 9. Cron / jobs protegidos

El único job programado (`vercel.json`) es `/api/cron/reminders`, ejecutado cada hora. Debe protegerse comparando un header/token contra la variable de entorno `CRON_SECRET`, para que la ruta no sea invocable públicamente sin ese secreto.

## 10. Cómo reportar una vulnerabilidad

Si encuentras una vulnerabilidad de seguridad en Mi Consultorio Pro:

1. No la publiques ni la explotes en datos de clientes reales.
2. Repórtala directamente al equipo del producto por el canal de soporte configurado (`/dashboard/soporte` si ya eres cliente, o el correo de contacto del proveedor si eres un tercero).
3. Incluye: pasos para reproducir, impacto estimado (¿cruza el aislamiento entre `clinic_id`? ¿expone credenciales o datos clínicos?), y si es posible, una prueba de concepto no destructiva.
4. Da tiempo razonable a que se corrija antes de divulgar públicamente.

Este es un producto en operación real con datos de salud de pacientes colombianos — cualquier hallazgo relacionado con fuga de datos entre consultorios (falla de RLS) o exposición de credenciales de pago se trata como prioridad crítica.

# Soporte — Plan Continuidad Clínica

Mi Consultorio Pro se vende con un modelo de soporte llamado **Plan Continuidad Clínica**: mientras la suscripción de soporte esté activa, cada consultorio tiene acceso a un sistema de tickets con categorías, prioridades y tiempos de respuesta objetivo (SLA). Este documento describe cómo funciona ese sistema tal como está construido hoy (`support_tickets`, `support_ticket_comments`, `support_plans`, `support_subscriptions` — migración `20260704160400_licensing_support.sql`) y cuáles son los compromisos de tiempo del plan.

## 1. Cómo se crea un ticket

Desde `/dashboard/soporte`, cualquier usuario con rol `clinic_owner`, `professional`, `assistant`, `receptionist` o `finance_user` puede crear un ticket indicando:

- **Asunto** y **descripción** del problema.
- **Categoría** (`support_ticket_category`): acceso, agenda, pagos, pasarelas, recordatorios, página pública, pacientes, reportes, diseño, soporte legal/documentos, configuración, error técnico, solicitud de mejora, backup/restauración, seguridad.
- **Prioridad** (`support_ticket_priority`): crítica, alta, media, baja.

El equipo de soporte del producto (rol `support_agent`, con visibilidad transversal a todas las clínicas) y el `super_admin` gestionan el ticket desde `/admin/soporte`: pueden comentar (incluyendo notas internas no visibles para el cliente, `is_internal`), asignarlo a un responsable y cambiar su estado.

## 2. Prioridades y SLA (Plan Continuidad Clínica)

| Prioridad | Primera respuesta | Resolución objetivo |
|---|---|---|
| **Crítica** (`critical`) | 1 hora | 4 a 8 horas hábiles |
| **Alta** (`high`) | 4 horas | 1 a 2 días |
| **Media** (`medium`) | 1 día | 2 a 5 días |
| **Baja** (`low`) | 2 días | Se atiende según roadmap/prioridad de producto |

Ejemplos de qué prioridad corresponde a cada situación (criterio comercial, no una regla automática del sistema):

- **Crítica**: el consultorio no puede cobrar, no puede acceder al sistema, o hay una sospecha de fuga de datos entre consultorios.
- **Alta**: una funcionalidad clave falla (agenda, recordatorios, pasarela de pago) pero hay una vía alterna operativa.
- **Media**: un error puntual que no bloquea la operación del día a día.
- **Baja**: solicitudes de mejora, ajustes de diseño, dudas de configuración.

**Nota de honestidad técnica:** el sistema registra `first_response_at` y `resolved_at` en cada ticket para medir el cumplimiento real de estos tiempos, y el dashboard de soporte agrega tickets abiertos/cerrados y tiempo promedio de respuesta. Pero **no hay hoy una automatización que calcule en tiempo real si un ticket está incumpliendo su SLA ni que lo escale automáticamente** — el estado `escalated` existe en el modelo de datos pero su uso depende de que el equipo de soporte lo marque manualmente. El SLA es, ante todo, un compromiso comercial del Plan Continuidad Clínica, medido con estos timestamps, no todavía un motor de alertas automáticas.

## 3. Estados de un ticket

`support_ticket_status`: `open` (abierto) → `in_review` (en revisión) → `waiting_client` (esperando al cliente) → `in_progress` (en progreso) → `resolved` (resuelto) → `closed` (cerrado). También existe `escalated` para tickets que requieren atención prioritaria fuera del flujo normal.

Al resolver un ticket se puede registrar un `csat_score` (1 a 5) como medida de satisfacción del cliente con la atención recibida.

## 4. Qué pasa si vence el plan anual

Mi Consultorio Pro se vende como **un plan anual único de $39 USD, que incluye el Plan Continuidad Clínica** — no son dos compras separadas. La licencia (`licenses.ends_at`) y la suscripción de soporte (`support_subscriptions.ends_at`) se otorgan juntas por 1 año desde el registro (migración `20260802100000_annual_plan.sql`) y deben renovarse juntas cada año.

**Si el plan vence sin renovarse, el sistema deja de estar operativo**: `app/(app)/layout.tsx` bloquea el acceso a agenda, pacientes, pagos y el resto de módulos, mostrando una pantalla de "plan vencido" en su lugar. Esto es un cambio respecto al modelo anterior (donde vencer el soporte no afectaba el uso del producto) — ahora licencia y soporte son la misma compra.

**Lo que nunca se bloquea ni se borra:**

- El dueño del consultorio (`clinic_owner`) puede seguir iniciando sesión en cualquier momento.
- Puede exportar todos los datos del consultorio en un archivo JSON descargable desde la pantalla de "plan vencido" (`/api/export/clinic-data`) — pacientes, citas, pagos, consentimientos, paquetes, etc.
- Ningún dato se elimina ni se oculta por falta de renovación.

Renovar (compra anual siguiente en Hotmart, o extensión manual desde `/admin/consultorios/[id]` mientras no haya automatización de renovación conectada a Hotmart) reactiva el sistema de inmediato con todos los datos intactos.

## 5. Planes de soporte

El catálogo de planes (`support_plans`, seed inicial en la migración) conserva los nombres **Esencial**, **Profesional** y **Centro** como valores internos del esquema, pero de cara al cliente Mi Consultorio Pro es **un solo plan anual con todo incluido** — estos nombres ya no representan niveles que el cliente elige o paga por separado (ver `lib/modules/index.ts`).

## 6. Cómo escalar un problema urgente

Si tienes un ticket crítico (el consultorio no puede operar) y no recibes respuesta dentro del SLA de primera respuesta (1 hora para crítica), usa el canal de contacto directo indicado por tu proveedor al momento de la venta, además de dejar el ticket abierto en el sistema — el ticket queda como registro y evidencia, pero el canal directo es el que garantiza que se note la urgencia real.

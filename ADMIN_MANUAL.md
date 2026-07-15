# Manual del panel superadmin — Mi Consultorio Pro

Este manual es para el equipo que opera Mi Consultorio Pro como producto (rol `super_admin`), no para los consultorios clientes. El panel vive en `/admin` y solo es accesible con ese rol (`is_super_admin()` en RLS, verificado en cada tabla administrativa).

## 1. Resumen (`/admin`)

La pantalla de inicio muestra cuatro cifras clave, cada una con enlace directo a su sección:

- Total de consultorios activos (`clinics`, excluyendo borrados lógicos).
- Licencias activas (`licenses.status = 'active'`).
- Tickets de soporte abiertos (`open`, `in_review`, `waiting_client`, `in_progress`).
- Soportes por vencer en los próximos 30 días (`support_subscriptions` con `ends_at` dentro de ese rango y `status = 'active'`).

## 2. Consultorios (`/admin/consultorios`)

Lista todos los consultorios registrados, mostrando: nombre comercial, slug público, si está publicado, si es un consultorio demo, y el estado de su licencia (badge de color según si está activa).

Al entrar al detalle de un consultorio (`/admin/consultorios/[id]`) puedes gestionar tres cosas:

### 2.1 Licencia

Tipos de licencia disponibles: **Esencial**, **Profesional**, **Centro** (`license_type`). Cada licencia define `professionals_allowed` y `locations_allowed` (límites de uso) y un estado:

| Estado | Significado |
|---|---|
| `active` | Licencia vigente y en uso normal |
| `trial` | Período de prueba (con `trial_ends_at`) |
| `suspended` | Suspendida — por ejemplo, por impago |
| `expired` | Vencida |
| `cancelled` | Cancelada definitivamente |

También hay un campo de notas internas (`internal_notes`), visible solo para el equipo del producto, nunca para el consultorio.

### 2.2 Plan Continuidad Clínica (soporte)

Cada consultorio tiene una `support_subscription` vinculada a un plan (`support_plans.plan_key`: esencial, profesional, centro — el mismo catálogo que las licencias, pero como suscripción de soporte independiente). Desde aquí defines la fecha de inicio y de vencimiento (`ends_at`) y el estado (`active`, `expiring_soon`, `expired`, `suspended`). Ver `SUPPORT.md` para el detalle de qué SLA corresponde a cada prioridad de ticket, y qué pasa realmente cuando el soporte vence (el sistema sigue funcionando, sin garantía de SLA).

### 2.3 Módulos activables

16 módulos cobrables por separado que puedes activar/desactivar por consultorio (`enabled_modules`, enum `module_key`):

`extra_professional` (profesional adicional), `extra_location` (sede adicional), `extra_payment_gateway` (pasarela adicional), `whatsapp_automation`, `sms`, `advanced_telehealth` (teleconsulta avanzada), `advanced_clinical_history` (historia clínica avanzada), `custom_domain` (dominio personalizado), `data_migration` (migración de datos), `extra_training` (capacitación adicional), `priority_support` (soporte prioritario), `advanced_therapeutic_packages` (paquetes terapéuticos avanzados), `group_workshops` (talleres grupales), `digital_resources` (recursos digitales), `premium_reports` (reportes premium), `premium_visual_customization` (personalización visual premium).

Cada activación/desactivación queda con su propio timestamp (`activated_at`/`deactivated_at`) y notas opcionales, permitiendo vender módulos como add-ons sin tener que mantener ramas de código separadas por cliente.

## 3. Soporte (`/admin/soporte`)

Vista global de tickets de **todos** los consultorios (visibilidad transversal propia de `support_agent`/`super_admin`, distinta a la vista de un `clinic_owner`, que solo ve los suyos). Desde el detalle de un ticket (`/admin/soporte/[id]`) puedes:

- **Asignar** el ticket a un responsable (`assign-button.tsx`).
- **Cambiar el estado** (`status-select.tsx`): abierto → en revisión → esperando al cliente → en progreso → resuelto → cerrado (o escalado).
- **Comentar** (`admin-comment-form.tsx`), pudiendo marcar el comentario como interno (`is_internal`) para que no lo vea el cliente, o público para que sí lo vea.

Recuerda: el cumplimiento de SLA se mide con los timestamps `first_response_at`/`resolved_at` del ticket, pero **no hay una alerta automática que te avise si un ticket crítico está por incumplir su SLA de 1 hora** — hoy depende de que el equipo lo monitoree activamente. Ver `SUPPORT.md`.

## 4. Métricas

El resumen de `/admin` cubre las métricas operativas básicas (consultorios, licencias, tickets, soportes por vencer). Existe además la tabla `system_health_logs` (métricas de plataforma: `metric_key`, `metric_value`, `metadata`, `recorded_at`), pensada para métricas de salud del sistema más granulares (uptime, tiempos de respuesta, etc.), con acceso exclusivo para `super_admin`. Su alimentación depende de que se registren eventos ahí — no hay hoy un dashboard de métricas históricas más allá del resumen de inicio.

## 5. Demos

Los consultorios demo se identifican dentro de `/admin/consultorios` por la etiqueta "Demo" junto a su slug (`clinics.is_demo = true`). No hay una pantalla separada `/admin/demos` en el código actual — la gestión de demos ocurre gestionando directamente el consultorio demo como cualquier otro consultorio (licencia, módulos, publicación), más la tabla `demo_data_profiles` (qué vertical apunta a qué `clinic_id`, y si está activo) y `sales_demo_sessions` (registro de cada visita a `/demo/[vertical]`, con su `referrer`) para entender qué vertical genera más interés comercial. Ver `SALES_DEMO.md` para el detalle de cómo opera `/demo/[vertical]` de cara al prospecto.

## 6. Plantillas globales

El catálogo de planes de soporte (`support_plans`: esencial, profesional, centro) es global y no pertenece a ningún `clinic_id` — se gestiona una sola vez para toda la plataforma y cada consultorio se suscribe a uno de esos planes. De igual forma, los textos por defecto de notificaciones (recordatorios, confirmaciones) viven embebidos en `lib/notifications` como plantilla base del sistema; si un consultorio no personaliza su propia fila en `notification_templates`, se usa automáticamente ese texto por defecto — así ningún consultorio se queda sin poder enviar recordatorios por falta de personalización.

## 7. Buenas prácticas para el equipo superadmin

- Antes de suspender o cancelar una licencia, confirma el estado del Plan Continuidad Clínica del mismo consultorio — son dos entidades independientes (`licenses` y `support_subscriptions`) que conviene mantener coherentes.
- Al activar un consultorio demo nuevo, verifícalo primero como no publicado, cárgale datos de `demo_data_profiles`, y solo márcalo `is_active = true` cuando el flujo completo (reserva, pago sandbox, consentimientos) esté probado — recuerda que la demo corre con el mismo código que producción.
- Los comentarios internos en tickets (`is_internal = true`) son el lugar correcto para dejar contexto sensible o notas de negociación — nunca lo escribas en un comentario público que el cliente pueda leer.

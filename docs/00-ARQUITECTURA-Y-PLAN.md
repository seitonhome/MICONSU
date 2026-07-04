# Mi Consultorio Pro — Arquitectura y Plan Maestro

> Documento previo a la escritura de código, según lo solicitado. Cubre: arquitectura general, modelo de datos, mapa de pantallas, flujos (paciente, profesional, pagos, soporte), roles y permisos, plan por fases, y riesgos con mitigaciones.

---

## 1. Arquitectura general

### 1.1 Filosofía de arquitectura

Multi-tenant real (no "una instancia por cliente"). Un solo despliegue en Vercel + un solo proyecto Supabase (o Supabase por región si escala), con **aislamiento lógico por `clinic_id`** reforzado con Row Level Security (RLS) en cada tabla, no solo en la capa de aplicación. La regla de oro: **si RLS no lo protege, no está protegido** — la UI y las Server Actions son una segunda capa, nunca la única.

### 1.2 Capas del sistema

```
┌─────────────────────────────────────────────────────────────┐
│  Next.js 15 (App Router)                                     │
│  ├─ (marketing)      → landing comercial, SEO, público       │
│  ├─ (public-booking) → /c/[clinicSlug], /p/[proSlug]         │
│  ├─ (portal)         → portal del paciente (magic link)      │
│  ├─ (app)            → dashboard autenticado del consultorio │
│  ├─ (superadmin)     → panel del dueño del producto          │
│  └─ (demo)           → modo demo aislado, datos sintéticos    │
├─────────────────────────────────────────────────────────────┤
│  Server Actions + Route Handlers (API interna)                │
│  ├─ Validación Zod en el borde (entrada)                      │
│  ├─ Capa de dominio (services/) — reglas de negocio           │
│  └─ Capa de acceso a datos (repositories/) — queries Supabase │
├─────────────────────────────────────────────────────────────┤
│  Supabase                                                     │
│  ├─ Postgres + RLS (multi-tenant por clinic_id)               │
│  ├─ Auth (roles custom vía JWT claims + tabla profiles)        │
│  ├─ Storage privado (documentos, notas, recursos)              │
│  └─ Edge Functions (webhooks de pago, cron de recordatorios)   │
├─────────────────────────────────────────────────────────────┤
│  Integraciones externas (adaptadores, todas detrás de interfaz)│
│  ├─ Pasarelas de pago (PaymentProvider interface)              │
│  ├─ Email transaccional (Resend, o alterno configurable)       │
│  └─ WhatsApp/SMS (stub preparado, no activo en Fase 1)         │
└─────────────────────────────────────────────────────────────┘
```

### 1.3 Estructura de carpetas (monorepo simple, no microservicios)

```
mi-consultorio-pro/
├─ app/
│  ├─ (marketing)/            # landing comercial
│  ├─ (public-booking)/c/[clinicSlug]/
│  ├─ (public-booking)/p/[proSlug]/
│  ├─ (portal)/portal/[token]/
│  ├─ (app)/dashboard/...
│  ├─ (app)/onboarding/...
│  ├─ (superadmin)/admin/...
│  ├─ (demo)/demo/[vertical]/
│  └─ api/webhooks/[provider]/route.ts
├─ lib/
│  ├─ supabase/ (server client, browser client, middleware)
│  ├─ payments/ (PaymentProvider interface + implementaciones)
│  ├─ notifications/ (EmailProvider interface + templates)
│  ├─ auth/ (roles, permisos, guards)
│  ├─ modules/ (feature flags por licencia)
│  └─ validation/ (schemas Zod compartidos)
├─ services/          # lógica de negocio por dominio (appointments, payments, patients...)
├─ repositories/       # acceso a datos por dominio
├─ components/
│  ├─ ui/ (shadcn)
│  ├─ patterns/ (empty states, wizards, cards de oportunidad)
│  └─ themes/ (5 temas visuales)
├─ supabase/
│  ├─ migrations/
│  ├─ seed/ (datos demo por vertical)
│  └─ policies/ (RLS documentadas)
└─ docs/ (este documento y los entregables .md)
```

### 1.4 Decisiones clave de arquitectura

| Decisión | Elección | Razón |
|---|---|---|
| Multi-tenancy | RLS por `clinic_id`, no schemas separados | Escala mejor, migraciones únicas, costo operativo bajo para medium ticket |
| Autorización | JWT custom claims (`role`, `clinic_id`) + tabla `profiles` como fuente de verdad | Supabase Auth no alcanza para roles finos; se resuelve en middleware + RLS |
| Pagos | Patrón adaptador (`PaymentProvider` interface) | Evita acoplarse a Wompi; permite multi-pasarela sin reescribir |
| Módulos/licencias | Feature flags leídos desde `enabled_modules` por `clinic_id`, evaluados en servidor | Permite vender módulos sin ramas de código separadas |
| Datos clínicos | Tablas separadas de datos administrativos, con RLS más estricta y auditoría de acceso | Aísla el mayor riesgo legal/reputacional del resto del sistema |
| Notificaciones | `NotificationProvider` interface, Email en Fase 1, WhatsApp/SMS como stub | Se vende como roadmap sin bloquear el lanzamiento |
| Modo demo | `clinic_id` reservados y marcados `is_demo=true`, datos sintéticos, mismas tablas | No duplica arquitectura; se resetea con un job |

---

## 2. Modelo de datos

### 2.1 Dominios y relaciones (resumen ERD)

```
clinics 1─* clinic_locations
clinics 1─* professionals ──* professional_credentials
clinics 1─1 clinic_branding
clinics 1─* services ──* professional_services (N:N con professionals)
clinics 1─* patients
clinics 1─* appointments ── patients / professionals / services / clinic_locations
appointments 1─* appointment_events (auditoría de estado)
appointments 1─* payment_intents 1─* payments 1─* payment_webhooks
patients 1─* consent_records ──* consent_documents
patients 1─* clinical_notes (solo si módulo clínico activo)
patients 1─* session_packages 1─* package_sessions
patients 1─* therapeutic_processes
clinics 1─* group_sessions ──* group_session_attendees (patients)
clinics 1─* waitlist_entries
patients 1─* post_consultation_followups
patients 1─* reviews
clinics 1─* support_tickets 1─* support_ticket_comments
clinics 1─1 licenses 1─* enabled_modules
clinics 1─1 support_subscriptions
```

### 2.2 Reglas transversales de esquema

- Toda tabla operativa tiene `clinic_id uuid not null references clinics(id)`.
- Toda tabla tiene `created_at`, `updated_at` (triggers `updated_at`), y `deleted_at` donde aplique borrado lógico.
- Todas las PK son `uuid default gen_random_uuid()`.
- Índices obligatorios: `(clinic_id)`, `(clinic_id, created_at)` en tablas de alto volumen (`appointments`, `payments`, `audit_logs`).
- Datos clínicos (`clinical_notes`, `treatment_plans`, `therapeutic_processes`) viven en tablas separadas de `patients` para poder aplicar RLS distinta y auditar accesos con granularidad propia (`clinical_notes_access_logs`).
- `payment_providers` guarda credenciales **cifradas** (pgsodium o cifrado a nivel de aplicación antes de insertar), nunca en texto plano.

### 2.3 Catálogo de tablas

Se usa el listado completo ya definido en el brief (profiles, clinics, clinic_branding, clinic_locations, professionals, professional_credentials, assistants, patients, services, service_categories, professional_services, availability_rules, blocked_times, rooms_or_chairs, appointments, appointment_events, waitlist_entries, payment_providers, payment_methods, payment_intents, payments, payment_webhooks, manual_payment_proofs, payment_reconciliation_logs, consent_documents, consent_records, patient_documents, clinical_notes, treatment_plans, therapeutic_processes, session_packages, package_sessions, group_sessions, intake_forms, intake_form_responses, resource_library, assigned_resources, post_consultation_followups, reviews, notification_templates, notification_logs, audit_logs, support_tickets, support_ticket_comments, support_plans, support_subscriptions, licenses, enabled_modules, system_health_logs, backup_logs, demo_data_profiles, sales_demo_sessions).

Esto se traduce a migraciones SQL versionadas en `supabase/migrations/`, agrupadas por dominio (01_core_tenant.sql, 02_scheduling.sql, 03_payments.sql, 04_clinical.sql, 05_support_licensing.sql, 06_demo.sql) en la fase de implementación.

---

## 3. Mapa de pantallas

```
/ (landing comercial)
/login  /register  /onboarding/[step]

/c/[clinicSlug]                      → página pública del consultorio
/p/[proSlug]                          → página pública del profesional
/c/[clinicSlug]/reservar/[serviceId]  → flujo de reserva
/reserva/[appointmentToken]           → confirmación / gestión de cita (sin login)

/portal/[patientToken]                → portal del paciente (magic link)

/dashboard                            → home del consultorio
/dashboard/agenda
/dashboard/pacientes  /dashboard/pacientes/[id]
/dashboard/servicios
/dashboard/pagos  /dashboard/pagos/conciliacion  /dashboard/pagos/configuracion
/dashboard/paquetes
/dashboard/procesos
/dashboard/grupales
/dashboard/lista-espera
/dashboard/seguimientos
/dashboard/recursos
/dashboard/resenas
/dashboard/reportes
/dashboard/oportunidades           → panel de oportunidad comercial
/dashboard/clinico/[patientId]     → módulo clínico protegido (permiso especial)
/dashboard/consentimientos
/dashboard/soporte
/dashboard/configuracion/{branding,servicios,horarios,pagos,legal,equipo,tema}

/admin (superadmin)
/admin/consultorios  /admin/licencias  /admin/modulos
/admin/soporte  /admin/metricas  /admin/demos  /admin/plantillas

/demo/[vertical]                     → medico | odontologo | psicologo | alternativa | bienestar
```

---

## 4. Flujo del paciente / consultante

1. Llega a `/c/[clinicSlug]` o `/p/[proSlug]` (link compartido, redes, WhatsApp).
2. Elige servicio → profesional (si aplica) → sede/modalidad → fecha → hora (slots calculados desde `availability_rules` menos `appointments`/`blocked_times`).
3. Ingresa datos básicos (nombre, documento, email, teléfono).
4. Acepta política de datos + consentimiento específico si el servicio lo requiere (`consent_documents` versionado).
5. Si el servicio requiere pago: elige método (anticipo/completo/manual/pasarela) → se crea `payment_intent`.
6. Confirmación: se crea `appointment` en estado según pago (`pending_payment`, `pending_manual_confirmation`, `confirmed`).
7. Recibe email de confirmación con: resumen, link de gestión (`appointmentToken`), botón "agregar a calendario", instrucciones previas.
8. Antes de la cita: recordatorio 24h y 2h (si aplica).
9. Post-cita: mensaje de seguimiento, recursos, encuesta, invitación a reservar control o renovar paquete.
10. En cualquier momento puede volver a `/reserva/[appointmentToken]` para reprogramar o cancelar (si las reglas del servicio lo permiten) sin necesidad de cuenta.

## 5. Flujo del profesional / consultorio

1. Registro → onboarding wizard (12 pasos definidos en el brief) → checklist de activación visible en el dashboard hasta completarse.
2. Día a día: abre `/dashboard`, ve citas de hoy, pagos pendientes, oportunidades de recuperación.
3. Gestiona agenda: confirma, reprograma, marca no-show, revisa lista de espera cuando cancela algo.
4. Atiende: si tiene módulo clínico activo, registra notas privadas asociadas a la cita/paciente.
5. Cobra: confirma pagos manuales en conciliación o deja que la pasarela confirme automáticamente vía webhook.
6. Da seguimiento: paquetes, procesos terapéuticos, recursos, seguimiento postconsulta.
7. Revisa reportes y el panel de oportunidad comercial semanalmente.
8. Escala a soporte cuando algo falla, con ticket categorizado y SLA visible.

## 6. Flujo de pagos

```
Paciente elige método → createPaymentIntent()
        │
        ├─ Pasarela automática → createCheckoutSession() → redirect/checkout externo
        │        └─ Webhook → validateWebhookSignature() → mapExternalStatusToInternalStatus()
        │                 → payments.status actualizado → appointment.status actualizado
        │
        ├─ Transferencia manual → manual_payment_proofs (comprobante subido)
        │        └─ Staff confirma en conciliación → payments.status = approved
        │
        └─ Pago presencial / link externo → registro manual o confirmación diferida

Expiración: si payment_intent expira sin confirmarse → libera el horario (cron/Edge Function)
Reembolso: refundPayment() → payments.status = refunded/partially_refunded → registro en payment_reconciliation_logs
```

Todo estado transita por una máquina de estados única (`pending → pending_confirmation → approved|rejected|expired|refunded`), independiente del proveedor, para que reportes y conciliación no dependan de la pasarela usada.

## 7. Flujo de soporte (Plan Continuidad Clínica)

```
Cliente reporta (in-app / email) → support_tickets (category, priority)
        → SLA calculado automáticamente según priority
        → responsable asignado → primera respuesta (timestamp registrado)
        → in_progress → resolved → cliente confirma / feedback (CSAT)
        → closed (o escalated si excede SLA)

Vencimiento de soporte:
support_subscriptions.status pasa a expiring_soon (30/15/7 días antes)
        → expired: sistema sigue operando, aviso interno, sin garantía de SLA
        → renovación reactiva soporte sin tocar datos
```

Dashboard de soporte agrega: tickets abiertos/cerrados, tiempo promedio de primera respuesta y resolución, cumplimiento de SLA, uptime, estado de backups — sirve tanto de herramienta operativa como de evidencia comercial de "soporte medible".

## 8. Roles y permisos

| Rol | Agenda | Pacientes (admin) | Notas clínicas | Pagos/Reportes financieros | Configuración | Soporte |
|---|---|---|---|---|---|---|
| super_admin | — (multi-tenant, fuera del tenant) | — | — | — | Global | Global |
| clinic_owner | Total | Total | Total (o según su rol clínico) | Total | Total | Crea tickets |
| professional/doctor/dentist/psychologist/psychiatrist/therapist/alternative_practitioner/wellness_provider | Propia | Propios pacientes | Propias notas | Solo lo propio | Su perfil/servicios | Crea tickets |
| assistant | Operativa (ver/mover citas) | Datos administrativos | Sin acceso | Sin acceso | No | No |
| receptionist | Confirma citas/pagos | Datos administrativos | Sin acceso | Ve pagos, no reportes financieros completos | No | No |
| finance_user | Sin acceso clínico | No | No | Total | No | No |
| support_agent | No | Mínimo necesario | Sin acceso salvo autorización explícita | No | No | Total |
| patient | Su propia cita (portal) | Su propio perfil | No | Sus propios pagos | No | No |

Aplicado en dos capas: (1) RLS en Postgres como barrera dura por `clinic_id` + `role`; (2) guards en Server Actions/middleware para UX (ocultar botones, redirigir) — nunca la única barrera.

---

## 9. Plan de implementación por fases

### Fase 1 — Producto vendible base (MVP medium ticket)
Auth + roles + multi-tenant · Onboarding · Branding · Servicios · Agenda · Página pública · Reservas · Pacientes · Consentimientos · Pagos manuales + 1 pasarela automática (Wompi) · Recordatorios email · Dashboard · Reportes básicos · Licencias · Soporte/tickets · Backups documentados · 1 demo comercial (medicina alternativa, por ser el vertical más diferenciador).

**Entregable de fin de fase:** se puede vender, instalar, cobrar y dar soporte a un consultorio real.

### Fase 2 — Medium ticket fuerte
Centro de pagos multi-pasarela · Conciliación avanzada · Lista de espera · Seguimiento postconsulta · Reseñas · Paquetes de sesiones · Procesos terapéuticos · Sesiones grupales · Portal del paciente · Biblioteca de recursos · Módulo clínico protegido · Reportes avanzados · Panel de oportunidad comercial · Dashboard de soporte.

### Fase 3 — Premium
WhatsApp/SMS · Teleconsulta avanzada · Dominio personalizado · Historia clínica avanzada · Firma electrónica · IA administrativa · Migración avanzada · Reportes premium · PWA avanzada · Integraciones externas.

Cada fase termina en un estado **vendible y estable**, no en un estado a medio construir — así el negocio puede empezar a facturar desde el fin de la Fase 1 mientras se construye la Fase 2.

---

## 10. Riesgos y mitigaciones

| # | Riesgo | Tipo | Mitigación |
|---|---|---|---|
| 1 | Fuga de datos clínicos entre consultorios por falla de RLS | Técnico/Legal | RLS obligatoria y probada con tests automatizados por tabla; ningún acceso directo sin `clinic_id`; revisión de policies en cada migración |
| 2 | Credenciales de pasarela expuestas | Técnico/Legal | Cifrado en reposo, nunca en el cliente, rotación documentada, RLS + rol restringido a `clinic_owner`/`finance_user` |
| 3 | Promesas de cura/diagnóstico en textos de medicina alternativa | Legal/Reputacional | Diccionario de lenguaje prohibido validado en plantillas; disclaimers obligatorios no editables a "cero"; revisión legal periódica |
| 4 | Confusión sobre historia clínica "oficial" vs módulo interno | Legal | El sistema declara explícitamente que no es HCE interoperable en Fase 1-2; texto visible en el módulo clínico |
| 5 | Cliente asume que el sistema cubre toda su obligación normativa (Ley 1581, RNBD, habilitación, etc.) | Legal/Comercial | Checklist legal editable con disclaimer explícito: "cada consultorio es responsable de validar sus obligaciones" |
| 6 | Webhook de pago falsificado o repetido | Técnico | Validación de firma obligatoria (`validateWebhookSignature`), idempotencia por `external_reference`, logs en `payment_webhooks` |
| 7 | Pérdida de datos por falla o error humano | Técnico/Continuidad | Backup diario + retención 30 días + backup externo semanal + prueba de restauración trimestral documentada |
| 8 | Cliente deja de pagar soporte y exige garantías | Comercial/Legal | Estados de `support_subscriptions` claros; el sistema sigue funcionando pero sin SLA; contrato lo explicita |
| 9 | Notificaciones revelan información sensible (ej. especialidad psiquiátrica) a terceros que ven el celular del paciente | Legal/Reputacional | Copys neutrales estandarizados ("tienes una cita programada"), sin mencionar especialidad o motivo |
| 10 | Acoplamiento fuerte a una sola pasarela (riesgo de negocio si cambia condiciones) | Comercial/Técnico | Patrón `PaymentProvider` desde el día 1, aunque Fase 1 solo active Wompi |
| 11 | Scope creep: intentar construir todo el brief de una sola vez | Comercial/Ejecución | Fases con criterio de "vendible" al cierre de cada una; no avanzar a Fase 2 sin Fase 1 estable en producción |
| 12 | Falta de expertise legal real del equipo (esto no reemplaza abogado/asesor en salud) | Legal | Documento `LEGAL_CHECKLIST_COLOMBIA.md` explícito en que no es asesoría jurídica |

---

## 11. Siguiente paso propuesto

Con este documento como base, la implementación arranca por el **Fase 1** en este orden interno (para minimizar retrabajo):

1. Scaffold del proyecto (Next.js 15 + TS + Tailwind + shadcn + Supabase).
2. Esquema SQL núcleo (tenant, auth, roles) + RLS.
3. Auth + middleware de roles.
4. Onboarding + branding + temas visuales.
5. Servicios + agenda + disponibilidad.
6. Página pública + flujo de reserva.
7. Pacientes + consentimientos.
8. Pagos manuales + Wompi.
9. Recordatorios por email.
10. Dashboard + reportes básicos.
11. Licencias + soporte/tickets.
12. Seed de demo (medicina alternativa) + landing comercial.

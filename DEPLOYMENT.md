# Despliegue — Mi Consultorio Pro

Stack de despliegue: **Vercel** (Next.js 15, App Router) + **Supabase** (Postgres, Auth, Storage). Este documento describe cómo desplegar el proyecto tal como está configurado hoy (`.env.example`, `vercel.json`, `supabase/migrations/`).

## 1. Requisitos previos

- Un proyecto de Supabase (Postgres + Auth + Storage habilitados).
- Un proyecto de Vercel conectado al repositorio.
- Cuenta de Resend (email transaccional) si vas a activar recordatorios.
- Credenciales de Wompi (sandbox o producción) si el consultorio va a usar esa pasarela — aunque, como se explica en `PAYMENT_PROVIDERS.md`, cada consultorio puede configurar las suyas propias desde el Centro de Pagos en vez de depender de las globales.

## 2. Variables de entorno

Todas están documentadas en `.env.example`, en la raíz del repo. Cópialo a `.env.local` para desarrollo y configura los mismos valores (salvo los de sandbox) como variables de entorno en Vercel para producción.

| Variable | Para qué sirve |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL del proyecto Supabase (Project Settings → API). Pública, se expone al navegador. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Llave anónima de Supabase, respetada por RLS. Pública. |
| `SUPABASE_SERVICE_ROLE_KEY` | Llave de servicio con `BYPASSRLS`. **Solo servidor**, nunca con prefijo `NEXT_PUBLIC_`, nunca commiteada. Usada por el cliente admin en Server Actions/Route Handlers (ej. creación de `payment_intents` para pacientes anónimos, escritura de `audit_logs`, envío de webhooks). |
| `NEXT_PUBLIC_APP_URL` | URL base pública de la app (usada para construir links de reserva, portal del paciente, redirect de checkout). En local: `http://localhost:3000`. |
| `APP_ENCRYPTION_KEY` | Clave AES-256-GCM (hex de 32 bytes) para cifrar/descifrar credenciales de pasarelas de pago (`lib/payments/crypto.ts`). Generar con `openssl rand -hex 32`. **Si cambia, las credenciales ya cifradas en `payment_providers` dejan de poder descifrarse** — hay que volver a guardarlas. |
| `RESEND_API_KEY` | API key de Resend para enviar recordatorios y confirmaciones por email. |
| `EMAIL_FROM` | Remitente de los correos transaccionales (ej. `"Mi Consultorio Pro <notificaciones@tudominio.com>"`). |
| `WOMPI_PUBLIC_KEY`, `WOMPI_PRIVATE_KEY`, `WOMPI_EVENTS_SECRET`, `WOMPI_INTEGRITY_SECRET` | Credenciales de Wompi. Son solo el **fallback/sandbox para desarrollo** — en producción cada consultorio guarda las suyas propias (cifradas) desde `/dashboard/pagos`. |
| `WHATSAPP_API_TOKEN`, `SMS_PROVIDER_API_KEY` | Reservadas para Fase 3 (WhatsApp/SMS). No hay lógica de envío activa todavía; no son necesarias para operar el sistema hoy. |
| `CRON_SECRET` | Token compartido para autenticar la llamada del cron de Vercel al endpoint `/api/cron/reminders`. Debe validarse en el handler antes de ejecutar el job. |

## 3. Aplicar migraciones de base de datos

Las migraciones viven en `supabase/migrations/`, ordenadas cronológicamente por su prefijo de timestamp:

1. `20260704160000_core_tenant.sql` — tenant núcleo, roles, RLS base.
2. `20260704160100_scheduling.sql` — agenda, disponibilidad, citas.
3. `20260704160200_payments.sql` — centro de pagos.
4. `20260704160300_consent_documents_audit.sql` — consentimientos, documentos, auditoría.
5. `20260704160400_licensing_support.sql` — licencias, módulos, soporte (Plan Continuidad Clínica).
6. `20260704160500_demo.sql` — modo demo.
7. `20260706120000_storage_buckets.sql` — buckets de Storage y sus políticas.
8. `20260706130000_professional_global_slug.sql` — slugs globales de profesional.
9. `20260706140000_patient_notes.sql` — notas de paciente.
10. `20260706150000_notifications.sql` — plantillas y logs de notificaciones.

Aplícalas con la CLI de Supabase:

```bash
supabase link --project-ref <project-ref>
supabase db push
```

**Nota importante de este proyecto (ver también la memoria de `docs/00-ARQUITECTURA-Y-PLAN.md`):** la conexión directa de la CLI (IPv6) puede fallar dependiendo de tu red/ISP, con timeouts al intentar `db push`. Si eso ocurre, usa el **connection pooler** de Supabase en vez de la conexión directa:

```
host: aws-0-<region>.pooler.supabase.com
port: 6543
user: postgres.<project-ref>
```

Puedes forzar el uso del pooler pasando la cadena de conexión completa a `supabase db push --db-url` con ese host/usuario, en vez de depender del `project-ref` resuelto automáticamente. Como último recurso, si el pooler tampoco es accesible desde tu entorno, las migraciones se pueden pegar y ejecutar manualmente en el **SQL Editor** del dashboard de Supabase, en el mismo orden — así fue como se aplicó el esquema la primera vez en este proyecto.

## 4. Despliegue en Vercel

1. Conecta el repositorio a un proyecto de Vercel.
2. Configura las variables de entorno de la tabla anterior en Project Settings → Environment Variables (usa entornos separados para Preview/Production si vas a probar con datos sandbox).
3. El build usa los scripts estándar de Next.js (`next build` / `next start`), sin pasos adicionales de build.
4. Verifica que el dominio de producción configurado coincida con `NEXT_PUBLIC_APP_URL`, porque esa variable se usa para construir links compartibles (reserva, portal del paciente, redirect de checkout de Wompi).

## 5. Cron de recordatorios

`vercel.json` define un único cron job:

```json
{
  "crons": [
    { "path": "/api/cron/reminders", "schedule": "0 * * * *" }
  ]
}
```

Se ejecuta cada hora en punto y dispara el envío de recordatorios de citas (24h y 2h antes) vía Resend, registrando cada intento en `notification_logs` (con deduplicación: no se reenvía el mismo `template_key` dos veces para la misma cita). El endpoint debe validar el header de autenticación del cron de Vercel contra `CRON_SECRET` antes de ejecutar cualquier envío, para que no sea invocable públicamente.

Los crons de Vercel solo se ejecutan en el entorno de **producción**; no se disparan automáticamente en Preview deployments.

## 6. Webhooks de pago

El endpoint de webhook (`app/api/webhooks/[provider]/route.ts` según la arquitectura documentada) debe estar accesible públicamente sin autenticación de sesión, porque lo invoca la pasarela de pago, no un usuario logueado — la seguridad ahí depende de `validateWebhookSignature()` de cada `PaymentProvider`, no de un secreto compartido en la URL.

## 7. Checklist mínimo antes de dar de alta un consultorio en producción

- Migraciones aplicadas y verificadas (RLS activo en cada tabla — puedes confirmarlo consultando `pg_policies` en el SQL Editor).
- Variables de entorno de producción configuradas, especialmente `APP_ENCRYPTION_KEY` (única, no reutilizada de desarrollo) y `SUPABASE_SERVICE_ROLE_KEY`.
- `CRON_SECRET` configurado y validado en `/api/cron/reminders`.
- Bucket `branding` y `clinical-documents` creados (los inserta la migración `20260706120000_storage_buckets.sql`; confírmalos en Storage del dashboard de Supabase).
- Licencia (`licenses`) y suscripción de soporte (`support_subscriptions`) creadas para el consultorio desde `/admin/consultorios/[id]` — ver `ADMIN_MANUAL.md`.

-- ============================================================================
-- Mi Consultorio Pro — Migración 10: recordatorios y notificaciones
-- Dominio: notification_templates, notification_logs
-- Canal inicial: email (Resend). WhatsApp/SMS quedan como columnas de canal
-- ya previstas para Fase 3, sin lógica de envío todavía.
-- ============================================================================

create type public.notification_channel as enum ('email', 'whatsapp', 'sms');

create type public.notification_template_key as enum (
  'appointment_confirmation',
  'appointment_reminder_24h',
  'appointment_reminder_2h',
  'appointment_cancelled',
  'appointment_rescheduled',
  'payment_pending',
  'payment_approved'
);

-- ── Tabla: notification_templates ───────────────────────────────────────
-- Catálogo de textos editables por clínica. Si una clínica no tiene fila
-- para un template_key, el sistema usa el texto por defecto embebido en
-- lib/notifications (no se bloquea el envío por falta de personalización).

create table public.notification_templates (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  template_key public.notification_template_key not null,
  channel public.notification_channel not null default 'email',
  subject text,
  body text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (clinic_id, template_key, channel)
);

create index idx_notification_templates_clinic_id on public.notification_templates (clinic_id);

create trigger trg_notification_templates_updated_at
  before update on public.notification_templates
  for each row execute function public.set_updated_at();

alter table public.notification_templates enable row level security;

create policy "notification_templates_owner_manage" on public.notification_templates
  for all using (
    public.is_super_admin()
    or (clinic_id = public.current_clinic_id() and public.current_role() = 'clinic_owner')
  ) with check (
    clinic_id = public.current_clinic_id()
  );

-- ── Tabla: notification_logs ─────────────────────────────────────────────
-- Auditoría de cada envío (o intento fallido). Escritura solo desde el
-- servidor (Server Actions/Route Handlers con cliente admin); sin políticas
-- de insert/update para anon/authenticated.

create table public.notification_logs (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  appointment_id uuid references public.appointments(id) on delete set null,
  patient_id uuid references public.patients(id) on delete set null,
  template_key public.notification_template_key not null,
  channel public.notification_channel not null default 'email',
  recipient text,
  status text not null default 'sent' check (status in ('sent','failed','skipped')),
  error text,
  created_at timestamptz not null default now()
);

create index idx_notification_logs_clinic_id on public.notification_logs (clinic_id, created_at);
create index idx_notification_logs_appointment_id on public.notification_logs (appointment_id);
-- Evita reenviar el mismo recordatorio dos veces para la misma cita.
create unique index uq_notification_logs_appointment_template on public.notification_logs (appointment_id, template_key)
  where appointment_id is not null and status = 'sent';

alter table public.notification_logs enable row level security;

create policy "notification_logs_owner_read" on public.notification_logs
  for select using (
    public.is_super_admin()
    or (clinic_id = public.current_clinic_id() and public.current_role() = 'clinic_owner')
  );

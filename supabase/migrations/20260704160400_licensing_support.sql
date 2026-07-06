-- ============================================================================
-- Mi Consultorio Pro — Migración 05: Licencias, módulos y soporte
-- (Plan Continuidad Clínica)
-- Dominio: licenses, enabled_modules, support_plans, support_subscriptions,
--          support_tickets, support_ticket_comments, system_health_logs,
--          backup_logs
-- ============================================================================

create type public.module_key as enum (
  'extra_professional',
  'extra_location',
  'extra_payment_gateway',
  'whatsapp_automation',
  'sms',
  'advanced_telehealth',
  'advanced_clinical_history',
  'custom_domain',
  'data_migration',
  'extra_training',
  'priority_support',
  'advanced_therapeutic_packages',
  'group_workshops',
  'digital_resources',
  'premium_reports',
  'premium_visual_customization'
);

create type public.support_ticket_category as enum (
  'acceso','agenda','pagos','pasarelas','recordatorios','pagina_publica',
  'pacientes','reportes','diseno','soporte_legal_documentos','configuracion',
  'error_tecnico','solicitud_mejora','backup_restauracion','seguridad'
);

create type public.support_ticket_priority as enum ('critical','high','medium','low');

create type public.support_ticket_status as enum (
  'open','in_review','waiting_client','in_progress','resolved','closed','escalated'
);

-- ── Tabla: licenses (1:1 con clinics) ───────────────────────────────────
-- Gestionada por el dueño del producto (super_admin). El consultorio solo
-- la consulta en modo lectura.

create table public.licenses (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null unique references public.clinics(id) on delete cascade,
  license_type text not null check (license_type in ('esencial','profesional','centro')),
  professionals_allowed int not null default 1,
  locations_allowed int not null default 1,
  status text not null default 'trial' check (status in ('active','trial','suspended','expired','cancelled')),
  purchased_at timestamptz,
  trial_ends_at timestamptz,
  internal_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_licenses_updated_at
  before update on public.licenses
  for each row execute function public.set_updated_at();

alter table public.licenses enable row level security;

create policy "licenses_read" on public.licenses
  for select using (
    public.is_super_admin()
    or (clinic_id = public.current_clinic_id() and public.current_role() = 'clinic_owner')
  );

create policy "licenses_manage_super_admin" on public.licenses
  for all using (public.is_super_admin()) with check (public.is_super_admin());

-- ── Tabla: enabled_modules ───────────────────────────────────────────────

create table public.enabled_modules (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  module_key public.module_key not null,
  is_active boolean not null default true,
  activated_at timestamptz not null default now(),
  deactivated_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (clinic_id, module_key)
);

create index idx_enabled_modules_clinic_id on public.enabled_modules (clinic_id);

create trigger trg_enabled_modules_updated_at
  before update on public.enabled_modules
  for each row execute function public.set_updated_at();

alter table public.enabled_modules enable row level security;

create policy "enabled_modules_read" on public.enabled_modules
  for select using (
    public.is_super_admin() or clinic_id = public.current_clinic_id()
  );

create policy "enabled_modules_manage_super_admin" on public.enabled_modules
  for all using (public.is_super_admin()) with check (public.is_super_admin());

-- ── Tabla: support_plans (catálogo global, no multi-tenant) ─────────────

create table public.support_plans (
  id uuid primary key default gen_random_uuid(),
  plan_key text not null unique check (plan_key in ('esencial','profesional','centro')),
  name text not null,
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_support_plans_updated_at
  before update on public.support_plans
  for each row execute function public.set_updated_at();

alter table public.support_plans enable row level security;

create policy "support_plans_read_all" on public.support_plans
  for select using (auth.uid() is not null);

create policy "support_plans_manage_super_admin" on public.support_plans
  for all using (public.is_super_admin()) with check (public.is_super_admin());

-- ── Tabla: support_subscriptions (Plan Continuidad Clínica) ─────────────

create table public.support_subscriptions (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null unique references public.clinics(id) on delete cascade,
  support_plan_id uuid not null references public.support_plans(id) on delete restrict,
  status text not null default 'active' check (status in ('active','expiring_soon','expired','suspended')),
  started_at date not null default current_date,
  ends_at date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_support_subscriptions_updated_at
  before update on public.support_subscriptions
  for each row execute function public.set_updated_at();

alter table public.support_subscriptions enable row level security;

create policy "support_subscriptions_read" on public.support_subscriptions
  for select using (
    public.is_super_admin()
    or (clinic_id = public.current_clinic_id() and public.current_role() = 'clinic_owner')
  );

create policy "support_subscriptions_manage_super_admin" on public.support_subscriptions
  for all using (public.is_super_admin()) with check (public.is_super_admin());

-- ── Tabla: support_tickets ───────────────────────────────────────────────
-- support_agent no pertenece a un clinic_id (es equipo interno del producto)
-- y necesita visibilidad transversal a todas las clínicas para operar el
-- Plan Continuidad Clínica.

create table public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  created_by uuid references public.profiles(id) on delete set null,
  assigned_to uuid references public.profiles(id) on delete set null,
  subject text not null,
  description text,
  category public.support_ticket_category not null default 'error_tecnico',
  priority public.support_ticket_priority not null default 'medium',
  status public.support_ticket_status not null default 'open',
  first_response_at timestamptz,
  resolved_at timestamptz,
  csat_score int check (csat_score between 1 and 5),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_support_tickets_clinic_id on public.support_tickets (clinic_id, created_at);
create index idx_support_tickets_status on public.support_tickets (status);

create trigger trg_support_tickets_updated_at
  before update on public.support_tickets
  for each row execute function public.set_updated_at();

alter table public.support_tickets enable row level security;

create policy "support_tickets_select" on public.support_tickets
  for select using (
    public.is_super_admin()
    or public.current_role() = 'support_agent'
    or clinic_id = public.current_clinic_id()
  );

create policy "support_tickets_insert" on public.support_tickets
  for insert with check (
    clinic_id = public.current_clinic_id()
    and public.current_role() in ('clinic_owner','professional','assistant','receptionist','finance_user')
  );

create policy "support_tickets_update" on public.support_tickets
  for update using (
    public.is_super_admin()
    or public.current_role() = 'support_agent'
    or (clinic_id = public.current_clinic_id() and public.current_role() = 'clinic_owner')
  ) with check (
    public.is_super_admin()
    or public.current_role() = 'support_agent'
    or clinic_id = public.current_clinic_id()
  );

-- ── Tabla: support_ticket_comments ───────────────────────────────────────

create table public.support_ticket_comments (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.support_tickets(id) on delete cascade,
  author_profile_id uuid references public.profiles(id) on delete set null,
  body text not null,
  attachments jsonb not null default '[]'::jsonb,
  is_internal boolean not null default false,
  created_at timestamptz not null default now()
);

create index idx_support_ticket_comments_ticket_id on public.support_ticket_comments (ticket_id);

alter table public.support_ticket_comments enable row level security;

create policy "support_ticket_comments_select" on public.support_ticket_comments
  for select using (
    public.is_super_admin()
    or public.current_role() = 'support_agent'
    or (
      not is_internal
      and exists (
        select 1 from public.support_tickets t
        where t.id = support_ticket_comments.ticket_id
          and t.clinic_id = public.current_clinic_id()
      )
    )
  );

create policy "support_ticket_comments_insert" on public.support_ticket_comments
  for insert with check (
    public.is_super_admin()
    or public.current_role() = 'support_agent'
    or exists (
      select 1 from public.support_tickets t
      where t.id = support_ticket_comments.ticket_id
        and t.clinic_id = public.current_clinic_id()
    )
  );

-- ── Tabla: system_health_logs (operación de la plataforma, superadmin) ──

create table public.system_health_logs (
  id uuid primary key default gen_random_uuid(),
  metric_key text not null,
  metric_value numeric,
  metadata jsonb not null default '{}'::jsonb,
  recorded_at timestamptz not null default now()
);

create index idx_system_health_logs_metric_key on public.system_health_logs (metric_key, recorded_at);

alter table public.system_health_logs enable row level security;

create policy "system_health_logs_super_admin_only" on public.system_health_logs
  for all using (public.is_super_admin()) with check (public.is_super_admin());

-- ── Tabla: backup_logs ────────────────────────────────────────────────────
-- clinic_id nulo = backup de plataforma (cubre todas las clínicas). Se
-- muestra en el dashboard de cualquier clinic_owner como tranquilidad
-- operativa, sin exponer detalles técnicos sensibles.

create table public.backup_logs (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid references public.clinics(id) on delete cascade,
  backup_type text not null check (backup_type in ('daily','weekly_external','manual_export','restore_test')),
  status text not null default 'success' check (status in ('success','failed','in_progress')),
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  size_bytes bigint,
  notes text,
  created_at timestamptz not null default now()
);

create index idx_backup_logs_clinic_id on public.backup_logs (clinic_id, created_at);

alter table public.backup_logs enable row level security;

create policy "backup_logs_select" on public.backup_logs
  for select using (
    public.is_super_admin()
    or clinic_id is null
    or (clinic_id = public.current_clinic_id() and public.current_role() = 'clinic_owner')
  );

create policy "backup_logs_manage_super_admin" on public.backup_logs
  for all using (public.is_super_admin()) with check (public.is_super_admin());

-- ── Seed mínimo de catálogo (no es dato demo, es catálogo de producto) ──

insert into public.support_plans (plan_key, name, description) values
  ('esencial', 'Plan Esencial', 'Soporte inicial incluido para el Plan Esencial de Mi Consultorio Pro.'),
  ('profesional', 'Plan Profesional', 'Soporte prioritario para el Plan Profesional de Mi Consultorio Pro.'),
  ('centro', 'Plan Centro', 'Soporte prioritario con revisión mensual para el Plan Centro de Mi Consultorio Pro.')
on conflict (plan_key) do nothing;

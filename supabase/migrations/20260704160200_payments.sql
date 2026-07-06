-- ============================================================================
-- Mi Consultorio Pro — Migración 03: Centro de pagos (Fase 1: manual + Wompi,
-- arquitectura preparada para multi-pasarela)
-- Dominio: payment_providers, payment_methods, payment_intents, payments,
--          payment_webhooks, manual_payment_proofs, payment_reconciliation_logs
-- Regla de seguridad: las credenciales de pasarela SOLO se leen a través del
-- cliente admin (service_role) en Server Actions/Route Handlers. Ningún rol
-- de clínica puede leer payment_providers directamente vía RLS; para mostrar
-- "métodos disponibles" sin credenciales se usa la vista payment_providers_public.
-- ============================================================================

create type public.payment_status as enum (
  'pending',
  'pending_confirmation',
  'approved',
  'rejected',
  'cancelled',
  'expired',
  'refunded',
  'partially_refunded',
  'failed',
  'manual_review'
);

-- ── Tabla: payment_providers ─────────────────────────────────────────────

create table public.payment_providers (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  provider_key text not null check (provider_key in (
    'wompi','mercado_pago','payu','epayco','bold','placetopay',
    'manual_transfer','in_person','external_link'
  )),
  display_name text not null,
  is_active boolean not null default false,
  is_sandbox boolean not null default true,
  -- Envoltorio cifrado (AES-256-GCM) generado y leído solo por lib/payments
  -- en el servidor, con APP_ENCRYPTION_KEY. Nunca se descifra en el cliente.
  encrypted_credentials text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (clinic_id, provider_key)
);

create index idx_payment_providers_clinic_id on public.payment_providers (clinic_id);

create trigger trg_payment_providers_updated_at
  before update on public.payment_providers
  for each row execute function public.set_updated_at();

alter table public.payment_providers enable row level security;

-- Solo clinic_owner (dueño del consultorio) puede leer/gestionar credenciales.
create policy "payment_providers_owner_only" on public.payment_providers
  for all using (
    public.is_super_admin()
    or (clinic_id = public.current_clinic_id() and public.current_role() = 'clinic_owner')
  ) with check (
    clinic_id = public.current_clinic_id()
  );

-- Vista sin credenciales para mostrar métodos disponibles: al staff de su
-- propia clínica (cualquier rol) y al público si la clínica está publicada.
-- Nota: esta vista se ejecuta con los privilegios de su propietario (postgres,
-- que en Supabase tiene BYPASSRLS), por eso el filtro de aislamiento se
-- escribe explícitamente en el WHERE en lugar de depender de RLS heredada.
create view public.payment_providers_public as
select id, clinic_id, provider_key, display_name, is_active, is_sandbox, created_at
from public.payment_providers
where
  clinic_id = public.current_clinic_id()
  or (
    is_active
    and exists (
      select 1 from public.clinics c
      where c.id = payment_providers.clinic_id and c.is_published and c.deleted_at is null
    )
  );

grant select on public.payment_providers_public to anon, authenticated;

-- ── Tabla: payment_methods ───────────────────────────────────────────────
-- Presentación/orden de los métodos derivados de un provider para el checkout.

create table public.payment_methods (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  payment_provider_id uuid not null references public.payment_providers(id) on delete cascade,
  label text not null,
  instructions text,
  is_active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_payment_methods_clinic_id on public.payment_methods (clinic_id);

create trigger trg_payment_methods_updated_at
  before update on public.payment_methods
  for each row execute function public.set_updated_at();

alter table public.payment_methods enable row level security;

create policy "payment_methods_owner_manage" on public.payment_methods
  for all using (
    public.is_super_admin()
    or (clinic_id = public.current_clinic_id() and public.current_role() = 'clinic_owner')
  ) with check (
    clinic_id = public.current_clinic_id()
  );

create policy "payment_methods_public_read" on public.payment_methods
  for select using (
    is_active
    and exists (
      select 1 from public.clinics c
      where c.id = payment_methods.clinic_id and c.is_published and c.deleted_at is null
    )
  );

-- ── Tabla: payment_intents ───────────────────────────────────────────────

create table public.payment_intents (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  appointment_id uuid references public.appointments(id) on delete set null,
  patient_id uuid not null references public.patients(id) on delete restrict,
  service_id uuid references public.services(id) on delete set null,
  payment_provider_id uuid references public.payment_providers(id) on delete set null,
  kind text not null default 'full' check (kind in ('deposit','full')),
  amount numeric(12,2) not null check (amount >= 0),
  currency text not null default 'COP',
  status public.payment_status not null default 'pending',
  external_reference text,
  checkout_url text,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_payment_intents_clinic_id on public.payment_intents (clinic_id);
create index idx_payment_intents_appointment_id on public.payment_intents (appointment_id);
create unique index uq_payment_intents_external_reference on public.payment_intents (external_reference) where external_reference is not null;

create trigger trg_payment_intents_updated_at
  before update on public.payment_intents
  for each row execute function public.set_updated_at();

alter table public.payment_intents enable row level security;

create policy "payment_intents_select" on public.payment_intents
  for select using (
    public.is_super_admin()
    or (
      clinic_id = public.current_clinic_id()
      and (
        public.current_role() in ('clinic_owner','assistant','receptionist','finance_user')
        or (
          public.current_role() = 'professional'
          and exists (
            select 1 from public.appointments a
            where a.id = payment_intents.appointment_id
              and a.professional_id = public.current_professional_id()
          )
        )
      )
    )
  );

create policy "payment_intents_staff_write" on public.payment_intents
  for update using (
    clinic_id = public.current_clinic_id()
    and public.current_role() in ('clinic_owner','assistant','receptionist','finance_user')
  ) with check (
    clinic_id = public.current_clinic_id()
  );

-- La creación de payment_intents (paciente anónimo o staff) pasa siempre por
-- una Server Action con el cliente admin, para aplicar reglas de negocio
-- (anticipo mínimo, expiración, servicio activo) antes de insertar.

-- ── Tabla: payments ──────────────────────────────────────────────────────

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  payment_intent_id uuid not null references public.payment_intents(id) on delete cascade,
  amount numeric(12,2) not null check (amount >= 0),
  currency text not null default 'COP',
  method text not null,
  external_transaction_id text,
  status public.payment_status not null default 'pending',
  paid_at timestamptz,
  confirmed_by uuid references public.profiles(id) on delete set null,
  raw_provider_response jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_payments_clinic_id on public.payments (clinic_id, created_at);
create index idx_payments_payment_intent_id on public.payments (payment_intent_id);

create trigger trg_payments_updated_at
  before update on public.payments
  for each row execute function public.set_updated_at();

alter table public.payments enable row level security;

create policy "payments_select" on public.payments
  for select using (
    public.is_super_admin()
    or (
      clinic_id = public.current_clinic_id()
      and (
        public.current_role() in ('clinic_owner','assistant','receptionist','finance_user')
        or (
          public.current_role() = 'professional'
          and exists (
            select 1 from public.payment_intents pi
            join public.appointments a on a.id = pi.appointment_id
            where pi.id = payments.payment_intent_id
              and a.professional_id = public.current_professional_id()
          )
        )
      )
    )
  );

create policy "payments_staff_write" on public.payments
  for update using (
    clinic_id = public.current_clinic_id()
    and public.current_role() in ('clinic_owner','assistant','receptionist','finance_user')
  ) with check (
    clinic_id = public.current_clinic_id()
  );

-- ── Tabla: payment_webhooks ──────────────────────────────────────────────
-- Solo el cliente admin (service_role, desde Route Handler) escribe aquí;
-- no se otorgan políticas de escritura a anon/authenticated. Auditoría cruda
-- de cada evento recibido, se valide o no su firma.

create table public.payment_webhooks (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid references public.clinics(id) on delete set null,
  provider_key text not null,
  external_event_id text,
  payload jsonb not null,
  signature_valid boolean not null default false,
  processed boolean not null default false,
  processed_at timestamptz,
  error text,
  received_at timestamptz not null default now()
);

create index idx_payment_webhooks_clinic_id on public.payment_webhooks (clinic_id);
create unique index uq_payment_webhooks_dedupe on public.payment_webhooks (provider_key, external_event_id) where external_event_id is not null;

alter table public.payment_webhooks enable row level security;

create policy "payment_webhooks_owner_read" on public.payment_webhooks
  for select using (
    public.is_super_admin()
    or (clinic_id = public.current_clinic_id() and public.current_role() = 'clinic_owner')
  );

-- ── Tabla: manual_payment_proofs ─────────────────────────────────────────

create table public.manual_payment_proofs (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  payment_intent_id uuid not null references public.payment_intents(id) on delete cascade,
  file_url text not null,
  uploaded_by_patient boolean not null default true,
  notes text,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

create index idx_manual_payment_proofs_clinic_id on public.manual_payment_proofs (clinic_id);

alter table public.manual_payment_proofs enable row level security;

create policy "manual_payment_proofs_staff" on public.manual_payment_proofs
  for all using (
    public.is_super_admin()
    or (
      clinic_id = public.current_clinic_id()
      and public.current_role() in ('clinic_owner','assistant','receptionist','finance_user')
    )
  ) with check (
    clinic_id = public.current_clinic_id()
  );

-- ── Tabla: payment_reconciliation_logs ───────────────────────────────────

create table public.payment_reconciliation_logs (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  payment_id uuid references public.payments(id) on delete set null,
  payment_intent_id uuid references public.payment_intents(id) on delete set null,
  action text not null check (action in ('confirmed','rejected','marked_review','refunded','exported')),
  performed_by uuid references public.profiles(id) on delete set null,
  notes text,
  created_at timestamptz not null default now()
);

create index idx_payment_reconciliation_logs_clinic_id on public.payment_reconciliation_logs (clinic_id, created_at);

alter table public.payment_reconciliation_logs enable row level security;

create policy "payment_reconciliation_logs_staff" on public.payment_reconciliation_logs
  for select using (
    public.is_super_admin()
    or (
      clinic_id = public.current_clinic_id()
      and public.current_role() in ('clinic_owner','assistant','receptionist','finance_user')
    )
  );

create policy "payment_reconciliation_logs_insert" on public.payment_reconciliation_logs
  for insert with check (
    clinic_id = public.current_clinic_id()
    and public.current_role() in ('clinic_owner','assistant','receptionist','finance_user')
  );

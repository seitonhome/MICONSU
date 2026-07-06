-- ============================================================================
-- Mi Consultorio Pro — Migración 02: Servicios y agenda
-- Dominio: categorías, servicios, disponibilidad, bloqueos, citas, eventos
-- de cita, lista de espera. Incluye guarda anti doble-reserva a nivel de
-- base de datos (constraint EXCLUDE), no solo en la capa de aplicación.
-- ============================================================================

create extension if not exists "btree_gist";

-- ── Enums ────────────────────────────────────────────────────────────────

-- Clasificación comercial/legal del servicio (brief: "Clasificación de
-- servicios"). Afecta textos legales, consentimientos y disclaimers.
create type public.service_classification as enum (
  'servicio_salud_habilitado',
  'terapia_alternativa_complementaria',
  'servicio_bienestar',
  'servicio_educativo_acompanamiento',
  'servicio_no_clinico'
);

create type public.appointment_status as enum (
  'requested',
  'pending_payment',
  'pending_manual_confirmation',
  'confirmed',
  'paid',
  'checked_in',
  'in_progress',
  'completed',
  'cancelled',
  'rescheduled',
  'no_show',
  'expired'
);

-- ── Tabla: service_categories ────────────────────────────────────────────

create table public.service_categories (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  name text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index idx_service_categories_clinic_id on public.service_categories (clinic_id);

create trigger trg_service_categories_updated_at
  before update on public.service_categories
  for each row execute function public.set_updated_at();

alter table public.service_categories enable row level security;

create policy "service_categories_staff" on public.service_categories
  for all using (
    public.is_super_admin() or clinic_id = public.current_clinic_id()
  ) with check (
    clinic_id = public.current_clinic_id() and public.current_role() = 'clinic_owner'
  );

create policy "service_categories_public_read" on public.service_categories
  for select using (
    deleted_at is null
    and exists (select 1 from public.clinics c where c.id = service_categories.clinic_id and c.is_published and c.deleted_at is null)
  );

-- ── Tabla: services ──────────────────────────────────────────────────────

create table public.services (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  category_id uuid references public.service_categories(id) on delete set null,
  name text not null,
  description text,
  classification public.service_classification not null default 'servicio_bienestar',
  duration_minutes int not null default 30 check (duration_minutes > 0),
  price numeric(12,2) not null default 0,
  price_visible boolean not null default true,
  requires_payment boolean not null default false,
  payment_type text not null default 'none' check (payment_type in ('none','deposit','full','manual','in_person')),
  deposit_amount numeric(12,2),
  modality text not null default 'both' check (modality in ('in_person','virtual','both')),
  default_location_id uuid references public.clinic_locations(id) on delete set null,
  color_hex text not null default '#0F4C4C',
  requires_additional_consent boolean not null default false,
  min_advance_hours int not null default 0,
  max_cancel_hours int not null default 0,
  is_active boolean not null default true,
  pre_instructions text,
  post_message text,
  disclaimer text,
  max_group_capacity int,
  allows_package boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index idx_services_clinic_id on public.services (clinic_id);

create trigger trg_services_updated_at
  before update on public.services
  for each row execute function public.set_updated_at();

alter table public.services enable row level security;

create policy "services_staff_select" on public.services
  for select using (
    public.is_super_admin() or clinic_id = public.current_clinic_id()
  );

create policy "services_owner_write" on public.services
  for insert with check (
    clinic_id = public.current_clinic_id() and public.current_role() = 'clinic_owner'
  );

create policy "services_owner_update" on public.services
  for update using (
    clinic_id = public.current_clinic_id() and public.current_role() = 'clinic_owner'
  ) with check (
    clinic_id = public.current_clinic_id()
  );

create policy "services_owner_delete" on public.services
  for delete using (
    clinic_id = public.current_clinic_id() and public.current_role() = 'clinic_owner'
  );

create policy "services_public_read" on public.services
  for select using (
    is_active and deleted_at is null
    and exists (select 1 from public.clinics c where c.id = services.clinic_id and c.is_published and c.deleted_at is null)
  );

-- ── Tabla: professional_services (N:N) ──────────────────────────────────

create table public.professional_services (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  professional_id uuid not null references public.professionals(id) on delete cascade,
  service_id uuid not null references public.services(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (professional_id, service_id)
);

create index idx_professional_services_clinic_id on public.professional_services (clinic_id);
create index idx_professional_services_service_id on public.professional_services (service_id);

alter table public.professional_services enable row level security;

create policy "professional_services_staff" on public.professional_services
  for all using (
    public.is_super_admin()
    or (clinic_id = public.current_clinic_id() and public.current_role() = 'clinic_owner')
  ) with check (
    clinic_id = public.current_clinic_id()
  );

create policy "professional_services_self_read" on public.professional_services
  for select using (
    clinic_id = public.current_clinic_id() and professional_id = public.current_professional_id()
  );

create policy "professional_services_public_read" on public.professional_services
  for select using (
    exists (
      select 1 from public.services s
      join public.clinics c on c.id = s.clinic_id
      where s.id = professional_services.service_id
        and s.is_active and s.deleted_at is null
        and c.is_published and c.deleted_at is null
    )
  );

-- ── Tabla: availability_rules ────────────────────────────────────────────
-- Forma no sensible del horario (día/hora/buffer). Se expone públicamente
-- para que el flujo de reserva calcule slots disponibles.

create table public.availability_rules (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  professional_id uuid not null references public.professionals(id) on delete cascade,
  location_id uuid references public.clinic_locations(id) on delete set null,
  day_of_week int not null check (day_of_week between 0 and 6),
  start_time time not null,
  end_time time not null check (end_time > start_time),
  buffer_minutes int not null default 0,
  is_recurring boolean not null default true,
  valid_from date,
  valid_to date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index idx_availability_rules_professional_id on public.availability_rules (professional_id);

create trigger trg_availability_rules_updated_at
  before update on public.availability_rules
  for each row execute function public.set_updated_at();

alter table public.availability_rules enable row level security;

create policy "availability_rules_staff_select" on public.availability_rules
  for select using (
    public.is_super_admin() or clinic_id = public.current_clinic_id()
  );

create policy "availability_rules_write" on public.availability_rules
  for insert with check (
    clinic_id = public.current_clinic_id()
    and (public.current_role() = 'clinic_owner' or professional_id = public.current_professional_id())
  );

create policy "availability_rules_update" on public.availability_rules
  for update using (
    clinic_id = public.current_clinic_id()
    and (public.current_role() = 'clinic_owner' or professional_id = public.current_professional_id())
  ) with check (
    clinic_id = public.current_clinic_id()
  );

create policy "availability_rules_delete" on public.availability_rules
  for delete using (
    clinic_id = public.current_clinic_id()
    and (public.current_role() = 'clinic_owner' or professional_id = public.current_professional_id())
  );

create policy "availability_rules_public_read" on public.availability_rules
  for select using (
    deleted_at is null
    and exists (
      select 1 from public.professionals p
      join public.clinics c on c.id = p.clinic_id
      where p.id = availability_rules.professional_id
        and p.is_active and p.deleted_at is null
        and c.is_published and c.deleted_at is null
    )
  );

-- ── Tabla: blocked_times ─────────────────────────────────────────────────
-- No se expone públicamente por fila (podría contener el motivo del bloqueo).
-- El flujo público de reserva consulta disponibilidad a través de la función
-- is_range_blocked(), que solo devuelve un booleano.

create table public.blocked_times (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  professional_id uuid references public.professionals(id) on delete cascade,
  starts_at timestamptz not null,
  ends_at timestamptz not null check (ends_at > starts_at),
  reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_blocked_times_professional_id on public.blocked_times (professional_id);
create index idx_blocked_times_clinic_range on public.blocked_times (clinic_id, starts_at, ends_at);

create trigger trg_blocked_times_updated_at
  before update on public.blocked_times
  for each row execute function public.set_updated_at();

alter table public.blocked_times enable row level security;

create policy "blocked_times_staff" on public.blocked_times
  for all using (
    public.is_super_admin()
    or (
      clinic_id = public.current_clinic_id()
      and (public.current_role() = 'clinic_owner' or professional_id = public.current_professional_id())
    )
  ) with check (
    clinic_id = public.current_clinic_id()
  );

-- ── Tabla: rooms_or_chairs ───────────────────────────────────────────────
-- Unidades físicas (consultorios, sillas odontológicas) por sede.

create table public.rooms_or_chairs (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  location_id uuid not null references public.clinic_locations(id) on delete cascade,
  name text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index idx_rooms_or_chairs_clinic_id on public.rooms_or_chairs (clinic_id);

create trigger trg_rooms_or_chairs_updated_at
  before update on public.rooms_or_chairs
  for each row execute function public.set_updated_at();

alter table public.rooms_or_chairs enable row level security;

create policy "rooms_or_chairs_staff" on public.rooms_or_chairs
  for all using (
    public.is_super_admin() or clinic_id = public.current_clinic_id()
  ) with check (
    clinic_id = public.current_clinic_id() and public.current_role() = 'clinic_owner'
  );

-- ── Tabla: appointments ──────────────────────────────────────────────────

create table public.appointments (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  patient_id uuid not null references public.patients(id) on delete restrict,
  professional_id uuid not null references public.professionals(id) on delete restrict,
  service_id uuid not null references public.services(id) on delete restrict,
  location_id uuid references public.clinic_locations(id) on delete set null,
  room_id uuid references public.rooms_or_chairs(id) on delete set null,
  starts_at timestamptz not null,
  ends_at timestamptz not null check (ends_at > starts_at),
  modality text not null default 'in_person' check (modality in ('in_person','virtual')),
  status public.appointment_status not null default 'requested',
  price numeric(12,2) not null default 0,
  deposit_required numeric(12,2) not null default 0,
  administrative_notes text,
  cancellation_reason text,
  cancelled_by uuid references public.profiles(id) on delete set null,
  rescheduled_from_id uuid references public.appointments(id) on delete set null,
  booking_token text not null unique default encode(gen_random_bytes(24), 'hex'),
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  -- Defensa a nivel de base de datos contra doble-reserva por condición de
  -- carrera: dos citas activas del mismo profesional no pueden solaparse.
  constraint appointments_no_overlap exclude using gist (
    professional_id with =,
    tstzrange(starts_at, ends_at) with &&
  ) where (status not in ('cancelled','expired','no_show') and deleted_at is null)
);

create index idx_appointments_clinic_id on public.appointments (clinic_id, starts_at);
create index idx_appointments_patient_id on public.appointments (patient_id);
create index idx_appointments_professional_id on public.appointments (professional_id, starts_at);

create trigger trg_appointments_updated_at
  before update on public.appointments
  for each row execute function public.set_updated_at();

alter table public.appointments enable row level security;

create policy "appointments_select" on public.appointments
  for select using (
    public.is_super_admin()
    or (
      clinic_id = public.current_clinic_id()
      and (
        public.current_role() in ('clinic_owner','assistant','receptionist','finance_user')
        or (public.current_role() = 'professional' and professional_id = public.current_professional_id())
      )
    )
  );

create policy "appointments_insert" on public.appointments
  for insert with check (
    clinic_id = public.current_clinic_id()
    and public.current_role() in ('clinic_owner','assistant','receptionist','professional')
  );

create policy "appointments_update" on public.appointments
  for update using (
    clinic_id = public.current_clinic_id()
    and (
      public.current_role() in ('clinic_owner','assistant','receptionist')
      or (public.current_role() = 'professional' and professional_id = public.current_professional_id())
    )
  ) with check (
    clinic_id = public.current_clinic_id()
  );

-- Reservas públicas (pacientes anónimos) se crean vía Server Action con el
-- cliente admin tras validar disponibilidad; no se otorga insert a "anon"
-- directamente para poder aplicar reglas de negocio (anticipación mínima,
-- expiración de pago, etc.) antes de escribir en la tabla.

-- ── Tabla: appointment_events (auditoría de estado) ─────────────────────

create table public.appointment_events (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  appointment_id uuid not null references public.appointments(id) on delete cascade,
  event_type text not null,
  from_status public.appointment_status,
  to_status public.appointment_status,
  actor_profile_id uuid references public.profiles(id) on delete set null,
  actor_type text not null default 'system' check (actor_type in ('patient','staff','system')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index idx_appointment_events_appointment_id on public.appointment_events (appointment_id);

alter table public.appointment_events enable row level security;

create policy "appointment_events_staff" on public.appointment_events
  for select using (
    public.is_super_admin()
    or (
      clinic_id = public.current_clinic_id()
      and exists (
        select 1 from public.appointments a
        where a.id = appointment_events.appointment_id
      )
    )
  );

-- ── Tabla: waitlist_entries ──────────────────────────────────────────────

create table public.waitlist_entries (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  patient_id uuid not null references public.patients(id) on delete cascade,
  service_id uuid references public.services(id) on delete set null,
  professional_id uuid references public.professionals(id) on delete set null,
  date_range_start date,
  date_range_end date,
  time_preference text,
  priority int not null default 0,
  status text not null default 'waiting' check (status in ('waiting','notified','booked','expired','cancelled')),
  notified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_waitlist_entries_clinic_id on public.waitlist_entries (clinic_id);

create trigger trg_waitlist_entries_updated_at
  before update on public.waitlist_entries
  for each row execute function public.set_updated_at();

alter table public.waitlist_entries enable row level security;

create policy "waitlist_entries_staff" on public.waitlist_entries
  for all using (
    public.is_super_admin()
    or (
      clinic_id = public.current_clinic_id()
      and public.current_role() in ('clinic_owner','assistant','receptionist','professional')
    )
  ) with check (
    clinic_id = public.current_clinic_id()
  );

-- ── Funciones públicas de disponibilidad (sin exponer tablas sensibles) ──

create or replace function public.has_conflicting_appointment(
  p_professional_id uuid,
  p_starts_at timestamptz,
  p_ends_at timestamptz,
  p_exclude_appointment_id uuid default null
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.appointments a
    where a.professional_id = p_professional_id
      and a.status not in ('cancelled','expired','no_show')
      and a.deleted_at is null
      and (p_exclude_appointment_id is null or a.id <> p_exclude_appointment_id)
      and tstzrange(a.starts_at, a.ends_at) && tstzrange(p_starts_at, p_ends_at)
  );
$$;

create or replace function public.is_range_blocked(
  p_professional_id uuid,
  p_clinic_id uuid,
  p_starts_at timestamptz,
  p_ends_at timestamptz
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.blocked_times bt
    where (bt.professional_id = p_professional_id or bt.professional_id is null)
      and bt.clinic_id = p_clinic_id
      and tstzrange(bt.starts_at, bt.ends_at) && tstzrange(p_starts_at, p_ends_at)
  );
$$;

grant execute on function public.has_conflicting_appointment(uuid, timestamptz, timestamptz, uuid) to anon, authenticated;
grant execute on function public.is_range_blocked(uuid, uuid, timestamptz, timestamptz) to anon, authenticated;

-- ── Ajuste diferido de patients_select (ver migración 01) ───────────────
-- Ahora que appointments existe, se restringe a "professional" a ver solo
-- los pacientes con los que tiene al menos una cita.

drop policy if exists "patients_select" on public.patients;

create policy "patients_select" on public.patients
  for select using (
    public.is_super_admin()
    or (
      clinic_id = public.current_clinic_id()
      and (
        public.current_role() in ('clinic_owner','assistant','receptionist')
        or (
          public.current_role() = 'professional'
          and exists (
            select 1 from public.appointments a
            where a.patient_id = patients.id
              and a.professional_id = public.current_professional_id()
          )
        )
      )
    )
  );

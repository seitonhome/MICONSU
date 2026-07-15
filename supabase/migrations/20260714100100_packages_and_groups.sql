-- ============================================================================
-- Mi Consultorio Pro — Migración 12: Paquetes de sesiones y sesiones grupales (Fase 2)
-- Dominio: session_packages, package_sessions, group_sessions,
-- group_session_attendees.
-- ============================================================================

create type public.session_package_status as enum (
  'active','completed','paused','expired','cancelled'
);

create type public.group_session_status as enum (
  'scheduled','completed','cancelled'
);

-- ── Tabla: session_packages ──────────────────────────────────────────────

create table public.session_packages (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  patient_id uuid not null references public.patients(id) on delete cascade,
  professional_id uuid not null references public.professionals(id) on delete restrict,
  service_id uuid references public.services(id) on delete set null,
  name text not null,
  total_sessions int not null check (total_sessions > 0),
  sessions_used int not null default 0,
  price_total numeric(12,2) not null default 0,
  deposit_amount numeric(12,2) not null default 0,
  starts_at date not null default current_date,
  valid_until date,
  status public.session_package_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_session_packages_clinic_id on public.session_packages (clinic_id);
create index idx_session_packages_patient_id on public.session_packages (patient_id);

create trigger trg_session_packages_updated_at
  before update on public.session_packages
  for each row execute function public.set_updated_at();

alter table public.session_packages enable row level security;

create policy "session_packages_staff" on public.session_packages
  for all using (
    public.is_super_admin()
    or (
      clinic_id = public.current_clinic_id()
      and (
        public.current_role() in ('clinic_owner','assistant','receptionist')
        or (public.current_role() = 'professional' and professional_id = public.current_professional_id())
      )
    )
  ) with check (
    clinic_id = public.current_clinic_id()
  );

-- ── Tabla: package_sessions ──────────────────────────────────────────────
-- Consumo individual de una sesión dentro de un paquete, opcionalmente
-- vinculado a la cita real donde se usó.

create table public.package_sessions (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  package_id uuid not null references public.session_packages(id) on delete cascade,
  appointment_id uuid references public.appointments(id) on delete set null,
  session_number int not null,
  used_at timestamptz not null default now(),
  notes text,
  created_at timestamptz not null default now(),
  unique (package_id, session_number)
);

create index idx_package_sessions_package_id on public.package_sessions (package_id);

alter table public.package_sessions enable row level security;

create policy "package_sessions_staff" on public.package_sessions
  for all using (
    public.is_super_admin()
    or exists (
      select 1 from public.session_packages sp
      where sp.id = package_sessions.package_id
        and sp.clinic_id = public.current_clinic_id()
        and (
          public.current_role() in ('clinic_owner','assistant','receptionist')
          or (public.current_role() = 'professional' and sp.professional_id = public.current_professional_id())
        )
    )
  ) with check (
    clinic_id = public.current_clinic_id()
  );

-- Mantiene session_packages.sessions_used sincronizado con las filas reales
-- de package_sessions, para que el conteo nunca dependa solo de la app.
create or replace function public.sync_package_sessions_used()
returns trigger
language plpgsql
as $$
begin
  update public.session_packages
  set sessions_used = (
    select count(*) from public.package_sessions where package_id = coalesce(new.package_id, old.package_id)
  )
  where id = coalesce(new.package_id, old.package_id);
  return coalesce(new, old);
end;
$$;

create trigger trg_sync_package_sessions_used
  after insert or delete on public.package_sessions
  for each row execute function public.sync_package_sessions_used();

-- ── Tabla: group_sessions ────────────────────────────────────────────────
-- Talleres, círculos, clases grupales, jornadas de bienestar.

create table public.group_sessions (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  professional_id uuid references public.professionals(id) on delete set null,
  service_id uuid references public.services(id) on delete set null,
  location_id uuid references public.clinic_locations(id) on delete set null,
  name text not null,
  description text,
  starts_at timestamptz not null,
  ends_at timestamptz not null check (ends_at > starts_at),
  modality text not null default 'in_person' check (modality in ('in_person','virtual')),
  virtual_link text,
  max_capacity int not null default 10 check (max_capacity > 0),
  status public.group_session_status not null default 'scheduled',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_group_sessions_clinic_id on public.group_sessions (clinic_id, starts_at);

create trigger trg_group_sessions_updated_at
  before update on public.group_sessions
  for each row execute function public.set_updated_at();

alter table public.group_sessions enable row level security;

create policy "group_sessions_staff" on public.group_sessions
  for all using (
    public.is_super_admin() or clinic_id = public.current_clinic_id()
  ) with check (
    clinic_id = public.current_clinic_id()
    and public.current_role() in ('clinic_owner','assistant','receptionist','professional')
  );

create policy "group_sessions_public_read" on public.group_sessions
  for select using (
    status = 'scheduled'
    and exists (select 1 from public.clinics c where c.id = group_sessions.clinic_id and c.is_published and c.deleted_at is null)
  );

-- ── Tabla: group_session_attendees ───────────────────────────────────────

create table public.group_session_attendees (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  group_session_id uuid not null references public.group_sessions(id) on delete cascade,
  patient_id uuid not null references public.patients(id) on delete cascade,
  payment_status text not null default 'pending' check (payment_status in ('pending','paid','waived')),
  attended boolean not null default false,
  created_at timestamptz not null default now(),
  unique (group_session_id, patient_id)
);

create index idx_group_session_attendees_session_id on public.group_session_attendees (group_session_id);

alter table public.group_session_attendees enable row level security;

create policy "group_session_attendees_staff" on public.group_session_attendees
  for all using (
    public.is_super_admin()
    or (
      clinic_id = public.current_clinic_id()
      and public.current_role() in ('clinic_owner','assistant','receptionist','professional')
    )
  ) with check (
    clinic_id = public.current_clinic_id()
  );

-- Guarda contra sobrecupo a nivel de base de datos: no permite insertar un
-- asistente si el taller ya alcanzó max_capacity.
create or replace function public.check_group_session_capacity()
returns trigger
language plpgsql
as $$
declare
  v_max int;
  v_count int;
begin
  select max_capacity into v_max from public.group_sessions where id = new.group_session_id;
  select count(*) into v_count from public.group_session_attendees where group_session_id = new.group_session_id;
  if v_count >= v_max then
    raise exception 'El taller ya alcanzó su cupo máximo.';
  end if;
  return new;
end;
$$;

create trigger trg_check_group_session_capacity
  before insert on public.group_session_attendees
  for each row execute function public.check_group_session_capacity();

-- ============================================================================
-- Mi Consultorio Pro — Migración 01: Núcleo multi-tenant
-- Dominio: extensiones, enums base, profiles, clinics, branding, sedes,
--          profesionales, credenciales, asistentes, pacientes.
-- Todas las tablas con datos de un consultorio llevan clinic_id y quedan
-- aisladas mediante Row Level Security (RLS). Ninguna tabla debe exponerse
-- sin política explícita.
-- ============================================================================

-- ── Extensiones ──────────────────────────────────────────────────────────
create extension if not exists "pgcrypto";

-- ── Enums ────────────────────────────────────────────────────────────────

-- Roles de permisos (no confundir con "tipo de práctica", ver practitioner_type).
-- Los roles clínicos específicos (medico, odontologo, psicologo, etc.) comparten
-- el mismo nivel de permisos ("professional": agenda propia, pacientes propios,
-- notas propias). El tipo de práctica se guarda en professionals.practitioner_type
-- y solo afecta lenguaje, plantillas y clasificación — no el nivel de acceso.
create type public.app_role as enum (
  'super_admin',
  'clinic_owner',
  'professional',
  'assistant',
  'receptionist',
  'finance_user',
  'support_agent',
  'patient'
);

-- Tipo de práctica del profesional/consultorio. Afecta textos, plantillas,
-- disclaimers y etiquetas, según la sección "Lenguaje adaptable por tipo de
-- práctica" del brief. Lista amplia pero no exhaustiva; "otro" cubre el resto.
create type public.practitioner_type as enum (
  'medico_general',
  'medico_especialista',
  'odontologo',
  'ortodoncista',
  'psicologo',
  'psiquiatra',
  'fisioterapeuta',
  'nutricionista',
  'medicina_funcional_integrativa',
  'medicina_alternativa',
  'homeopatia',
  'acupuntura_mtc',
  'ayurveda',
  'naturopatia',
  'terapia_neural',
  'quiropraxia',
  'osteopatia',
  'biomagnetismo',
  'bioenergetica',
  'reiki',
  'biosanacion_biodescodificacion',
  'coaching_mentoria_emocional',
  'terapias_respiracion_meditacion',
  'terapias_corporales_masajes',
  'otro'
);

create type public.visual_theme as enum (
  'clinico_moderno',
  'bienestar_premium',
  'integrativo',
  'terapeutico_emocional',
  'odontologico_premium',
  'personalizado'
);

-- ── Utilidades compartidas ───────────────────────────────────────────────

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ── Tabla: clinics ───────────────────────────────────────────────────────

create table public.clinics (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  commercial_name text not null,
  legal_name text,
  tax_id text,
  description text,
  contact_email text,
  contact_phone text,
  whatsapp_number text,
  website_url text,
  primary_practitioner_type public.practitioner_type,
  label_overrides jsonb not null default '{}'::jsonb,
  legal_disclaimer text,
  is_demo boolean not null default false,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create trigger trg_clinics_updated_at
  before update on public.clinics
  for each row execute function public.set_updated_at();

-- ── Tabla: profiles (extiende auth.users) ───────────────────────────────

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  clinic_id uuid references public.clinics(id) on delete set null,
  role public.app_role not null default 'clinic_owner',
  full_name text not null default '',
  email text,
  phone text,
  avatar_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_profiles_clinic_id on public.profiles (clinic_id);

create trigger trg_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- ── Funciones auxiliares de RLS (security definer, solo lectura acotada) ─

create or replace function public.current_clinic_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select clinic_id from public.profiles where id = auth.uid();
$$;

create or replace function public.current_role()
returns public.app_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.is_super_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select role from public.profiles where id = auth.uid()) = 'super_admin', false);
$$;

revoke all on function public.current_clinic_id() from public;
revoke all on function public.current_role() from public;
revoke all on function public.is_super_admin() from public;
grant execute on function public.current_clinic_id() to authenticated, anon;
grant execute on function public.current_role() to authenticated, anon;
grant execute on function public.is_super_admin() to authenticated, anon;

-- current_professional_id() se define más abajo, después de crear la tabla
-- public.professionals (esta función language sql se valida contra el
-- catálogo en el momento de creación, a diferencia de las funciones plpgsql).

-- ── Alta automática de profile al crear un usuario en auth.users ───────
-- El rol y clinic_id por defecto pueden venir en raw_user_meta_data al crear
-- el usuario (ej. invitaciones hechas por el clinic_owner vía Admin API).

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role, clinic_id)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    coalesce((new.raw_user_meta_data ->> 'role')::public.app_role, 'clinic_owner'),
    nullif(new.raw_user_meta_data ->> 'clinic_id', '')::uuid
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Evita que un usuario escale privilegios modificando su propio rol o
-- consultorio directamente. La asignación inicial de clinic_owner ocurre
-- solo a través de create_clinic_and_assign_owner() (security definer).
create or replace function public.prevent_self_privilege_escalation()
returns trigger
language plpgsql
as $$
begin
  if auth.uid() = old.id and public.current_role() <> 'super_admin' then
    if new.role <> old.role or new.clinic_id is distinct from old.clinic_id then
      raise exception 'No puedes modificar tu propio rol o consultorio.';
    end if;
  end if;
  return new;
end;
$$;

create trigger trg_prevent_self_privilege_escalation
  before update on public.profiles
  for each row execute function public.prevent_self_privilege_escalation();

-- ── RPC: creación de consultorio + asignación de dueño ──────────────────
-- Único camino permitido para que un usuario recién registrado quede
-- vinculado como clinic_owner de un consultorio nuevo.

create or replace function public.create_clinic_and_assign_owner(
  p_commercial_name text,
  p_slug text
)
returns public.clinics
language plpgsql
security definer
set search_path = public
as $$
declare
  v_clinic public.clinics;
begin
  if auth.uid() is null then
    raise exception 'Se requiere sesión activa.';
  end if;

  if exists (select 1 from public.profiles where id = auth.uid() and clinic_id is not null) then
    raise exception 'El usuario ya pertenece a un consultorio.';
  end if;

  insert into public.clinics (commercial_name, slug)
  values (p_commercial_name, p_slug)
  returning * into v_clinic;

  update public.profiles
  set clinic_id = v_clinic.id, role = 'clinic_owner'
  where id = auth.uid();

  insert into public.clinic_branding (clinic_id)
  values (v_clinic.id);

  return v_clinic;
end;
$$;

grant execute on function public.create_clinic_and_assign_owner(text, text) to authenticated;

-- ── RLS: clinics ─────────────────────────────────────────────────────────

alter table public.clinics enable row level security;

create policy "clinics_staff_select" on public.clinics
  for select using (
    public.is_super_admin() or id = public.current_clinic_id()
  );

create policy "clinics_public_read" on public.clinics
  for select using (is_published = true and deleted_at is null);

create policy "clinics_owner_update" on public.clinics
  for update using (
    id = public.current_clinic_id() and public.current_role() = 'clinic_owner'
  ) with check (
    id = public.current_clinic_id()
  );

-- ── RLS: profiles ────────────────────────────────────────────────────────

alter table public.profiles enable row level security;

create policy "profiles_select_self" on public.profiles
  for select using (id = auth.uid());

create policy "profiles_select_same_clinic" on public.profiles
  for select using (
    public.is_super_admin()
    or (clinic_id is not null and clinic_id = public.current_clinic_id())
  );

create policy "profiles_update_self" on public.profiles
  for update using (id = auth.uid())
  with check (id = auth.uid());

create policy "profiles_owner_manage_staff" on public.profiles
  for update using (
    public.current_role() = 'clinic_owner'
    and clinic_id = public.current_clinic_id()
    and id <> auth.uid()
  ) with check (
    clinic_id = public.current_clinic_id()
    and role <> 'clinic_owner'
  );

-- ── Tabla: clinic_branding (1:1 con clinics) ────────────────────────────

create table public.clinic_branding (
  clinic_id uuid primary key references public.clinics(id) on delete cascade,
  logo_url text,
  cover_image_url text,
  professional_photo_url text,
  primary_color text not null default '#0F4C4C',
  secondary_color text not null default '#F5F1E8',
  visual_theme public.visual_theme not null default 'clinico_moderno',
  font_style text not null default 'default',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_clinic_branding_updated_at
  before update on public.clinic_branding
  for each row execute function public.set_updated_at();

alter table public.clinic_branding enable row level security;

create policy "clinic_branding_staff" on public.clinic_branding
  for all using (
    public.is_super_admin()
    or (clinic_id = public.current_clinic_id() and public.current_role() in ('clinic_owner','professional'))
  ) with check (
    clinic_id = public.current_clinic_id()
  );

create policy "clinic_branding_public_read" on public.clinic_branding
  for select using (
    exists (
      select 1 from public.clinics c
      where c.id = clinic_branding.clinic_id and c.is_published = true and c.deleted_at is null
    )
  );

-- ── Tabla: clinic_locations ──────────────────────────────────────────────

create table public.clinic_locations (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  name text not null,
  address text,
  city text,
  country text not null default 'CO',
  is_virtual boolean not null default false,
  google_maps_url text,
  phone text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index idx_clinic_locations_clinic_id on public.clinic_locations (clinic_id);

create trigger trg_clinic_locations_updated_at
  before update on public.clinic_locations
  for each row execute function public.set_updated_at();

alter table public.clinic_locations enable row level security;

create policy "clinic_locations_staff" on public.clinic_locations
  for all using (
    public.is_super_admin()
    or clinic_id = public.current_clinic_id()
  ) with check (
    clinic_id = public.current_clinic_id()
  );

create policy "clinic_locations_public_read" on public.clinic_locations
  for select using (
    is_active and deleted_at is null
    and exists (
      select 1 from public.clinics c
      where c.id = clinic_locations.clinic_id and c.is_published = true and c.deleted_at is null
    )
  );

-- ── Tabla: professionals ─────────────────────────────────────────────────

create table public.professionals (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  profile_id uuid references public.profiles(id) on delete set null,
  slug text not null,
  practitioner_type public.practitioner_type not null default 'otro',
  full_name text not null,
  specialty_label text,
  bio text,
  photo_url text,
  license_number text,
  accepts_virtual boolean not null default true,
  accepts_in_person boolean not null default true,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (clinic_id, slug)
);

create index idx_professionals_clinic_id on public.professionals (clinic_id);
create index idx_professionals_profile_id on public.professionals (profile_id);

create trigger trg_professionals_updated_at
  before update on public.professionals
  for each row execute function public.set_updated_at();

alter table public.professionals enable row level security;

create policy "professionals_staff_select" on public.professionals
  for select using (
    public.is_super_admin() or clinic_id = public.current_clinic_id()
  );

create policy "professionals_staff_write" on public.professionals
  for insert with check (
    clinic_id = public.current_clinic_id()
    and public.current_role() = 'clinic_owner'
  );

create policy "professionals_staff_update" on public.professionals
  for update using (
    clinic_id = public.current_clinic_id()
    and (public.current_role() = 'clinic_owner' or profile_id = auth.uid())
  ) with check (
    clinic_id = public.current_clinic_id()
  );

create policy "professionals_staff_delete" on public.professionals
  for delete using (
    clinic_id = public.current_clinic_id() and public.current_role() = 'clinic_owner'
  );

create policy "professionals_public_read" on public.professionals
  for select using (
    is_active and deleted_at is null
    and exists (
      select 1 from public.clinics c
      where c.id = professionals.clinic_id and c.is_published = true and c.deleted_at is null
    )
  );

create or replace function public.current_professional_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select id from public.professionals where profile_id = auth.uid();
$$;

revoke all on function public.current_professional_id() from public;
grant execute on function public.current_professional_id() to authenticated, anon;

-- ── Tabla: professional_credentials ──────────────────────────────────────

create table public.professional_credentials (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  professional_id uuid not null references public.professionals(id) on delete cascade,
  credential_type text not null,
  title text not null,
  issuing_entity text,
  issue_date date,
  expiry_date date,
  document_url text,
  is_verified boolean not null default false,
  is_public boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_professional_credentials_clinic_id on public.professional_credentials (clinic_id);
create index idx_professional_credentials_professional_id on public.professional_credentials (professional_id);

create trigger trg_professional_credentials_updated_at
  before update on public.professional_credentials
  for each row execute function public.set_updated_at();

alter table public.professional_credentials enable row level security;

create policy "professional_credentials_staff" on public.professional_credentials
  for all using (
    public.is_super_admin() or clinic_id = public.current_clinic_id()
  ) with check (
    clinic_id = public.current_clinic_id()
  );

create policy "professional_credentials_public_read" on public.professional_credentials
  for select using (
    is_public = true and is_verified = true
    and exists (
      select 1 from public.professionals p
      join public.clinics c on c.id = p.clinic_id
      where p.id = professional_credentials.professional_id
        and p.is_active and p.deleted_at is null
        and c.is_published = true and c.deleted_at is null
    )
  );

-- ── Tabla: assistants ────────────────────────────────────────────────────
-- Relación operativa entre un perfil (rol assistant/receptionist) y los
-- profesionales cuya agenda puede operar. scope='all' ve toda la agenda de
-- la clínica; scope='selected' se limita a assigned_professional_ids.

create table public.assistants (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  scope text not null default 'all' check (scope in ('all','selected')),
  assigned_professional_ids uuid[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (clinic_id, profile_id)
);

create index idx_assistants_clinic_id on public.assistants (clinic_id);

create trigger trg_assistants_updated_at
  before update on public.assistants
  for each row execute function public.set_updated_at();

alter table public.assistants enable row level security;

create policy "assistants_owner_manage" on public.assistants
  for all using (
    public.is_super_admin()
    or (clinic_id = public.current_clinic_id() and public.current_role() = 'clinic_owner')
  ) with check (
    clinic_id = public.current_clinic_id()
  );

create policy "assistants_self_read" on public.assistants
  for select using (profile_id = auth.uid());

-- ── Tabla: patients ──────────────────────────────────────────────────────
-- Datos administrativos únicamente. Los datos clínicos viven en tablas
-- separadas (módulo clínico, Fase 2) con RLS y auditoría propias.

create table public.patients (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  full_name text not null,
  document_type text,
  document_number text,
  email text,
  phone text,
  birth_date date,
  city text,
  emergency_contact_name text,
  emergency_contact_phone text,
  status text not null default 'active' check (status in ('active','inactive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index idx_patients_clinic_id on public.patients (clinic_id);
create index idx_patients_clinic_document on public.patients (clinic_id, document_number);

create trigger trg_patients_updated_at
  before update on public.patients
  for each row execute function public.set_updated_at();

alter table public.patients enable row level security;

-- Política provisional: la tabla appointments todavía no existe en esta
-- migración. Se reemplaza en 20260704160100_scheduling.sql por una versión
-- que restringe a "professional" solo a sus propios pacientes (vía citas).
create policy "patients_select" on public.patients
  for select using (
    public.is_super_admin()
    or (
      clinic_id = public.current_clinic_id()
      and public.current_role() in ('clinic_owner','assistant','receptionist','professional')
    )
  );

create policy "patients_insert" on public.patients
  for insert with check (
    clinic_id = public.current_clinic_id()
    and public.current_role() in ('clinic_owner','assistant','receptionist','professional')
  );

create policy "patients_update" on public.patients
  for update using (
    clinic_id = public.current_clinic_id()
    and public.current_role() in ('clinic_owner','assistant','receptionist')
  ) with check (
    clinic_id = public.current_clinic_id()
  );

create policy "patients_delete" on public.patients
  for delete using (
    clinic_id = public.current_clinic_id() and public.current_role() = 'clinic_owner'
  );

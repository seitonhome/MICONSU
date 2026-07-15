-- ============================================================================
-- Mi Consultorio Pro — Migración 13: Biblioteca de recursos, seguimiento
-- postconsulta, reseñas y formularios previos (Fase 2)
-- Dominio: resource_library, assigned_resources, post_consultation_followups,
-- reviews, intake_forms, intake_form_responses.
-- ============================================================================

create type public.resource_type as enum ('pdf','audio','video','guide','exercise','other');
create type public.followup_type as enum ('thank_you','satisfaction_survey','review_request','package_renewal','custom');
create type public.followup_status as enum ('pending','sent','completed','skipped');
create type public.review_status as enum ('private','approved','featured');

-- ── Tabla: resource_library ──────────────────────────────────────────────
-- Archivos viven en el bucket privado "clinical-documents" bajo
-- {clinic_id}/resources/..., igual convención que patient_documents.

create table public.resource_library (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  title text not null,
  description text,
  resource_type public.resource_type not null default 'pdf',
  file_url text not null,
  created_by uuid references public.profiles(id) on delete set null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index idx_resource_library_clinic_id on public.resource_library (clinic_id);

create trigger trg_resource_library_updated_at
  before update on public.resource_library
  for each row execute function public.set_updated_at();

alter table public.resource_library enable row level security;

create policy "resource_library_staff" on public.resource_library
  for all using (
    public.is_super_admin()
    or (
      clinic_id = public.current_clinic_id()
      and public.current_role() in ('clinic_owner','assistant','professional')
    )
  ) with check (
    clinic_id = public.current_clinic_id()
  );

-- ── Tabla: assigned_resources ────────────────────────────────────────────

create table public.assigned_resources (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  resource_id uuid not null references public.resource_library(id) on delete cascade,
  patient_id uuid not null references public.patients(id) on delete cascade,
  appointment_id uuid references public.appointments(id) on delete set null,
  assigned_by uuid references public.profiles(id) on delete set null,
  assigned_at timestamptz not null default now(),
  viewed_at timestamptz
);

create index idx_assigned_resources_patient_id on public.assigned_resources (patient_id);
create index idx_assigned_resources_clinic_id on public.assigned_resources (clinic_id);

alter table public.assigned_resources enable row level security;

create policy "assigned_resources_staff" on public.assigned_resources
  for all using (
    public.is_super_admin()
    or (
      clinic_id = public.current_clinic_id()
      and public.current_role() in ('clinic_owner','assistant','receptionist','professional')
    )
  ) with check (
    clinic_id = public.current_clinic_id()
  );

-- El portal del paciente (magic link, sin sesión Supabase) lee esta tabla
-- vía Server Action con el cliente admin tras validar el token del paciente,
-- no directamente desde el navegador — por eso no hay política "patient".

-- ── Tabla: post_consultation_followups ───────────────────────────────────

create table public.post_consultation_followups (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  patient_id uuid not null references public.patients(id) on delete cascade,
  appointment_id uuid references public.appointments(id) on delete set null,
  followup_type public.followup_type not null default 'thank_you',
  status public.followup_status not null default 'pending',
  scheduled_for timestamptz not null default now(),
  sent_at timestamptz,
  message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_post_consultation_followups_clinic_id on public.post_consultation_followups (clinic_id, scheduled_for);
create index idx_post_consultation_followups_status on public.post_consultation_followups (status, scheduled_for);

create trigger trg_post_consultation_followups_updated_at
  before update on public.post_consultation_followups
  for each row execute function public.set_updated_at();

alter table public.post_consultation_followups enable row level security;

create policy "post_consultation_followups_staff" on public.post_consultation_followups
  for all using (
    public.is_super_admin()
    or (
      clinic_id = public.current_clinic_id()
      and public.current_role() in ('clinic_owner','assistant','receptionist','professional')
    )
  ) with check (
    clinic_id = public.current_clinic_id()
  );

-- ── Tabla: reviews ────────────────────────────────────────────────────────
-- No se publican reseñas automáticamente: nacen "private" y el staff decide
-- aprobarlas/destacarlas antes de mostrarlas en la página pública, para no
-- exponer sin querer información sensible (brief: "No publicar información
-- sensible").

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  patient_id uuid references public.patients(id) on delete set null,
  appointment_id uuid references public.appointments(id) on delete set null,
  professional_id uuid references public.professionals(id) on delete set null,
  service_id uuid references public.services(id) on delete set null,
  rating int not null check (rating between 1 and 5),
  comment text,
  status public.review_status not null default 'private',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_reviews_clinic_id on public.reviews (clinic_id);

create trigger trg_reviews_updated_at
  before update on public.reviews
  for each row execute function public.set_updated_at();

alter table public.reviews enable row level security;

create policy "reviews_staff_manage" on public.reviews
  for all using (
    public.is_super_admin()
    or (
      clinic_id = public.current_clinic_id()
      and public.current_role() in ('clinic_owner','assistant','receptionist')
    )
  ) with check (
    clinic_id = public.current_clinic_id()
  );

create policy "reviews_public_read_approved" on public.reviews
  for select using (
    status in ('approved','featured')
    and exists (select 1 from public.clinics c where c.id = reviews.clinic_id and c.is_published and c.deleted_at is null)
  );

-- La reseña la deja el paciente/consultante vía un link enviado por
-- seguimiento postconsulta (sin sesión); se inserta vía Server Action con
-- el cliente admin, no hay política de insert directa para "anon".

-- ── Tabla: intake_forms ───────────────────────────────────────────────────
-- Formularios previos configurables por servicio (brief: "Formularios
-- previos configurables"). fields es un array jsonb de definiciones simples
-- {key,label,type,required} — sin datos sensibles innecesarios.

create table public.intake_forms (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  service_id uuid references public.services(id) on delete cascade,
  title text not null,
  fields jsonb not null default '[]'::jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_intake_forms_clinic_id on public.intake_forms (clinic_id);

create trigger trg_intake_forms_updated_at
  before update on public.intake_forms
  for each row execute function public.set_updated_at();

alter table public.intake_forms enable row level security;

create policy "intake_forms_staff" on public.intake_forms
  for all using (
    public.is_super_admin()
    or (clinic_id = public.current_clinic_id() and public.current_role() = 'clinic_owner')
  ) with check (
    clinic_id = public.current_clinic_id()
  );

create policy "intake_forms_public_read" on public.intake_forms
  for select using (
    is_active
    and exists (select 1 from public.clinics c where c.id = intake_forms.clinic_id and c.is_published and c.deleted_at is null)
  );

-- ── Tabla: intake_form_responses ─────────────────────────────────────────

create table public.intake_form_responses (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  intake_form_id uuid not null references public.intake_forms(id) on delete cascade,
  patient_id uuid references public.patients(id) on delete set null,
  appointment_id uuid references public.appointments(id) on delete set null,
  responses jsonb not null default '{}'::jsonb,
  submitted_at timestamptz not null default now()
);

create index idx_intake_form_responses_form_id on public.intake_form_responses (intake_form_id);

alter table public.intake_form_responses enable row level security;

create policy "intake_form_responses_staff_read" on public.intake_form_responses
  for select using (
    public.is_super_admin()
    or (
      clinic_id = public.current_clinic_id()
      and public.current_role() in ('clinic_owner','assistant','receptionist','professional')
    )
  );

-- Las respuestas del paciente durante la reserva pública se insertan vía
-- Server Action con el cliente admin, igual que consent_records.

-- ============================================================================
-- Mi Consultorio Pro — Migración 11: Módulo clínico protegido (Fase 2)
-- Dominio: clinical_notes, treatment_plans, therapeutic_processes,
-- clinical_notes_access_logs.
-- Acceso restringido: solo clinic_owner y el profesional tratante (vía citas)
-- pueden ver datos clínicos. assistant/receptionist/finance_user NO tienen
-- ninguna política de acceso a estas tablas (brief: "Restricción máxima para
-- asistentes"). No se declara interoperabilidad oficial de historia clínica
-- en esta fase — ver docs/00-ARQUITECTURA-Y-PLAN.md.
-- ============================================================================

create type public.therapeutic_process_status as enum (
  'active','paused','completed','abandoned','cancelled'
);

-- ── Tabla: clinical_notes ────────────────────────────────────────────────
-- Nota clínica genérica, adaptable por tipo de práctica (los campos son
-- deliberadamente amplios: un médico usa chief_complaint/diagnosis, un
-- psicólogo usa evolution/follow_up_plan, medicina alternativa usa
-- recommendations). La etiqueta visible se adapta en la capa de aplicación
-- según professionals.practitioner_type (lib/domain/labels.ts).

create table public.clinical_notes (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  patient_id uuid not null references public.patients(id) on delete cascade,
  professional_id uuid not null references public.professionals(id) on delete restrict,
  appointment_id uuid references public.appointments(id) on delete set null,
  chief_complaint text,
  evolution_notes text,
  diagnosis text,
  recommendations text,
  follow_up_plan text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index idx_clinical_notes_clinic_id on public.clinical_notes (clinic_id);
create index idx_clinical_notes_patient_id on public.clinical_notes (patient_id, created_at desc);
create index idx_clinical_notes_professional_id on public.clinical_notes (professional_id);

create trigger trg_clinical_notes_updated_at
  before update on public.clinical_notes
  for each row execute function public.set_updated_at();

alter table public.clinical_notes enable row level security;

create policy "clinical_notes_owner_full" on public.clinical_notes
  for all using (
    public.is_super_admin()
    or (clinic_id = public.current_clinic_id() and public.current_role() = 'clinic_owner')
  ) with check (
    clinic_id = public.current_clinic_id()
  );

create policy "clinical_notes_professional_own" on public.clinical_notes
  for all using (
    clinic_id = public.current_clinic_id()
    and public.current_role() = 'professional'
    and professional_id = public.current_professional_id()
  ) with check (
    clinic_id = public.current_clinic_id()
    and professional_id = public.current_professional_id()
  );

-- ── Tabla: treatment_plans ───────────────────────────────────────────────
-- Enfocado en odontología ("Plan de tratamiento" del brief) pero reutilizable
-- por cualquier práctica que maneje procedimientos con abonos/saldo.

create table public.treatment_plans (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  patient_id uuid not null references public.patients(id) on delete cascade,
  professional_id uuid not null references public.professionals(id) on delete restrict,
  title text not null,
  procedures jsonb not null default '[]'::jsonb,
  teeth_involved text,
  total_amount numeric(12,2) not null default 0,
  paid_amount numeric(12,2) not null default 0,
  status text not null default 'active' check (status in ('active','completed','cancelled')),
  next_appointment_suggestion date,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index idx_treatment_plans_clinic_id on public.treatment_plans (clinic_id);
create index idx_treatment_plans_patient_id on public.treatment_plans (patient_id);

create trigger trg_treatment_plans_updated_at
  before update on public.treatment_plans
  for each row execute function public.set_updated_at();

alter table public.treatment_plans enable row level security;

create policy "treatment_plans_owner_full" on public.treatment_plans
  for all using (
    public.is_super_admin()
    or (clinic_id = public.current_clinic_id() and public.current_role() = 'clinic_owner')
  ) with check (
    clinic_id = public.current_clinic_id()
  );

create policy "treatment_plans_professional_own" on public.treatment_plans
  for all using (
    clinic_id = public.current_clinic_id()
    and public.current_role() = 'professional'
    and professional_id = public.current_professional_id()
  ) with check (
    clinic_id = public.current_clinic_id()
    and professional_id = public.current_professional_id()
  );

-- ── Tabla: therapeutic_processes ─────────────────────────────────────────
-- Seguimiento de procesos multi-sesión (terapia, biosanación, coaching).

create table public.therapeutic_processes (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  patient_id uuid not null references public.patients(id) on delete cascade,
  professional_id uuid not null references public.professionals(id) on delete restrict,
  objective text,
  sessions_planned int,
  progress_notes text,
  tasks_recommendations text,
  next_session_at timestamptz,
  status public.therapeutic_process_status not null default 'active',
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index idx_therapeutic_processes_clinic_id on public.therapeutic_processes (clinic_id);
create index idx_therapeutic_processes_patient_id on public.therapeutic_processes (patient_id);

create trigger trg_therapeutic_processes_updated_at
  before update on public.therapeutic_processes
  for each row execute function public.set_updated_at();

alter table public.therapeutic_processes enable row level security;

create policy "therapeutic_processes_owner_full" on public.therapeutic_processes
  for all using (
    public.is_super_admin()
    or (clinic_id = public.current_clinic_id() and public.current_role() = 'clinic_owner')
  ) with check (
    clinic_id = public.current_clinic_id()
  );

create policy "therapeutic_processes_professional_own" on public.therapeutic_processes
  for all using (
    clinic_id = public.current_clinic_id()
    and public.current_role() = 'professional'
    and professional_id = public.current_professional_id()
  ) with check (
    clinic_id = public.current_clinic_id()
    and professional_id = public.current_professional_id()
  );

-- ── Tabla: clinical_notes_access_logs ────────────────────────────────────
-- Auditoría de acceso a notas clínicas (brief: "Auditoría de acceso").
-- Se escribe siempre desde el servidor con el cliente admin, nunca desde
-- el navegador — por eso no hay política de insert para authenticated.

create table public.clinical_notes_access_logs (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  clinical_note_id uuid not null references public.clinical_notes(id) on delete cascade,
  accessed_by uuid references public.profiles(id) on delete set null,
  action text not null default 'view' check (action in ('view','edit')),
  created_at timestamptz not null default now()
);

create index idx_clinical_notes_access_logs_note_id on public.clinical_notes_access_logs (clinical_note_id, created_at desc);

alter table public.clinical_notes_access_logs enable row level security;

create policy "clinical_notes_access_logs_owner_read" on public.clinical_notes_access_logs
  for select using (
    public.is_super_admin()
    or (clinic_id = public.current_clinic_id() and public.current_role() = 'clinic_owner')
  );

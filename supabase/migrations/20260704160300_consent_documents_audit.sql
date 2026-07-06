-- ============================================================================
-- Mi Consultorio Pro — Migración 04: Consentimientos, documentos y auditoría
-- Dominio: consent_documents, consent_records, patient_documents, audit_logs
-- ============================================================================

create type public.consent_document_type as enum (
  'privacy_policy',
  'data_authorization',
  'sensitive_data_authorization',
  'informed_consent_general',
  'teleconsultation_consent',
  'service_specific_consent',
  'cancellation_policy',
  'refund_policy',
  'terms_and_conditions',
  'alternative_medicine_disclaimer',
  'wellness_disclaimer',
  'non_clinical_disclaimer'
);

-- ── Tabla: consent_documents ─────────────────────────────────────────────

create table public.consent_documents (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  document_type public.consent_document_type not null,
  service_id uuid references public.services(id) on delete cascade,
  title text not null,
  body text not null,
  version int not null default 1,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_consent_documents_clinic_id on public.consent_documents (clinic_id);

create trigger trg_consent_documents_updated_at
  before update on public.consent_documents
  for each row execute function public.set_updated_at();

alter table public.consent_documents enable row level security;

create policy "consent_documents_staff_manage" on public.consent_documents
  for all using (
    public.is_super_admin()
    or (clinic_id = public.current_clinic_id() and public.current_role() = 'clinic_owner')
  ) with check (
    clinic_id = public.current_clinic_id()
  );

create policy "consent_documents_staff_read" on public.consent_documents
  for select using (clinic_id = public.current_clinic_id());

create policy "consent_documents_public_read" on public.consent_documents
  for select using (
    is_active
    and exists (
      select 1 from public.clinics c
      where c.id = consent_documents.clinic_id and c.is_published and c.deleted_at is null
    )
  );

-- ── Tabla: consent_records ───────────────────────────────────────────────
-- Aceptación registrada por el paciente/consultante. Se guarda evidencia
-- legal mínima (ip, user agent, versión aceptada) según el brief.

create table public.consent_records (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  patient_id uuid not null references public.patients(id) on delete cascade,
  document_id uuid not null references public.consent_documents(id) on delete restrict,
  document_version int not null,
  appointment_id uuid references public.appointments(id) on delete set null,
  accepted_at timestamptz not null default now(),
  ip_address inet,
  user_agent text,
  acceptance_method text not null default 'web_form' check (acceptance_method in ('web_form','portal','staff_recorded')),
  created_at timestamptz not null default now()
);

create index idx_consent_records_clinic_id on public.consent_records (clinic_id);
create index idx_consent_records_patient_id on public.consent_records (patient_id);

alter table public.consent_records enable row level security;

create policy "consent_records_select" on public.consent_records
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
            where a.patient_id = consent_records.patient_id
              and a.professional_id = public.current_professional_id()
          )
        )
      )
    )
  );

create policy "consent_records_staff_insert" on public.consent_records
  for insert with check (
    clinic_id = public.current_clinic_id()
    and public.current_role() in ('clinic_owner','assistant','receptionist','professional')
  );

-- La aceptación hecha por un paciente anónimo durante la reserva pública se
-- inserta vía Server Action con el cliente admin (bypassa RLS de forma
-- controlada), nunca directo desde el navegador del paciente.

-- ── Tabla: patient_documents ──────────────────────────────────────────────

create table public.patient_documents (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  patient_id uuid not null references public.patients(id) on delete cascade,
  uploaded_by uuid references public.profiles(id) on delete set null,
  file_url text not null,
  file_name text not null,
  document_type text,
  is_clinical boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index idx_patient_documents_clinic_id on public.patient_documents (clinic_id);
create index idx_patient_documents_patient_id on public.patient_documents (patient_id);

create trigger trg_patient_documents_updated_at
  before update on public.patient_documents
  for each row execute function public.set_updated_at();

alter table public.patient_documents enable row level security;

-- Documentos administrativos (is_clinical = false): visibles para dueño,
-- asistente, recepcionista y el profesional del paciente.
-- Documentos clínicos (is_clinical = true): solo dueño y el profesional
-- tratante — ni asistente ni recepcionista los ven.
create policy "patient_documents_select" on public.patient_documents
  for select using (
    public.is_super_admin()
    or (
      clinic_id = public.current_clinic_id()
      and deleted_at is null
      and (
        public.current_role() = 'clinic_owner'
        or (
          not is_clinical
          and public.current_role() in ('assistant','receptionist')
        )
        or (
          public.current_role() = 'professional'
          and exists (
            select 1 from public.appointments a
            where a.patient_id = patient_documents.patient_id
              and a.professional_id = public.current_professional_id()
          )
        )
      )
    )
  );

create policy "patient_documents_insert" on public.patient_documents
  for insert with check (
    clinic_id = public.current_clinic_id()
    and public.current_role() in ('clinic_owner','assistant','receptionist','professional')
  );

create policy "patient_documents_update" on public.patient_documents
  for update using (
    clinic_id = public.current_clinic_id()
    and public.current_role() in ('clinic_owner','professional')
  ) with check (
    clinic_id = public.current_clinic_id()
  );

-- ── Tabla: audit_logs ─────────────────────────────────────────────────────
-- Solo lectura para clinic_owner/super_admin. La escritura ocurre siempre
-- desde el servidor (Server Actions/Route Handlers) con el cliente admin,
-- nunca directamente desde el navegador.

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid references public.clinics(id) on delete cascade,
  actor_profile_id uuid references public.profiles(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  before_data jsonb,
  after_data jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamptz not null default now()
);

create index idx_audit_logs_clinic_id on public.audit_logs (clinic_id, created_at);
create index idx_audit_logs_entity on public.audit_logs (entity_type, entity_id);

alter table public.audit_logs enable row level security;

create policy "audit_logs_owner_read" on public.audit_logs
  for select using (
    public.is_super_admin()
    or (clinic_id = public.current_clinic_id() and public.current_role() = 'clinic_owner')
  );

-- ── Portal del paciente: login real con magic link ─────────────────────
-- Vincula filas de public.patients (registro administrativo por clínica,
-- sin cuenta propia) con una cuenta real de auth.users, para que un
-- paciente pueda autenticarse una sola vez y ver su información en todas
-- las clínicas donde tenga historial, sin exponer datos de otros pacientes.

alter table public.patients
  add column user_id uuid references auth.users(id) on delete set null;

create index idx_patients_user_id on public.patients (user_id) where user_id is not null;

-- Un mismo usuario no puede quedar vinculado dos veces al mismo paciente
-- dentro de una misma clínica (sí puede tener un registro por clínica).
create unique index uq_patients_clinic_user on public.patients (clinic_id, user_id) where user_id is not null;

-- ── Reclamo de registros al iniciar sesión ──────────────────────────────
-- Ejecutada por el propio paciente justo después de validar el magic link.
-- Vincula (por email, case-insensitive) cualquier registro de paciente sin
-- reclamar en cualquier clínica donde haya reservado antes. security definer
-- porque el rol 'patient' no tiene permiso de UPDATE directo sobre patients.
create or replace function public.claim_patient_records()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email text;
begin
  select email into v_email from auth.users where id = auth.uid();
  if v_email is null then
    return;
  end if;

  update public.patients
  set user_id = auth.uid()
  where user_id is null
    and deleted_at is null
    and email is not null
    and lower(email) = lower(v_email);
end;
$$;

revoke all on function public.claim_patient_records() from public;
grant execute on function public.claim_patient_records() to authenticated;

-- ── RLS: acceso de lectura del propio paciente ──────────────────────────

create policy "patients_portal_self_read" on public.patients
  for select using (user_id = auth.uid());

create policy "appointments_portal_self_read" on public.appointments
  for select using (
    exists (
      select 1 from public.patients p
      where p.id = appointments.patient_id and p.user_id = auth.uid()
    )
  );

create policy "payment_intents_portal_self_read" on public.payment_intents
  for select using (
    exists (
      select 1 from public.patients p
      where p.id = payment_intents.patient_id and p.user_id = auth.uid()
    )
  );

create policy "payments_portal_self_read" on public.payments
  for select using (
    exists (
      select 1 from public.payment_intents pi
      join public.patients p on p.id = pi.patient_id
      where pi.id = payments.payment_intent_id and p.user_id = auth.uid()
    )
  );

create policy "consent_records_portal_self_read" on public.consent_records
  for select using (
    exists (
      select 1 from public.patients p
      where p.id = consent_records.patient_id and p.user_id = auth.uid()
    )
  );

create policy "session_packages_portal_self_read" on public.session_packages
  for select using (
    exists (
      select 1 from public.patients p
      where p.id = session_packages.patient_id and p.user_id = auth.uid()
    )
  );

create policy "assigned_resources_portal_self_read" on public.assigned_resources
  for select using (
    exists (
      select 1 from public.patients p
      where p.id = assigned_resources.patient_id and p.user_id = auth.uid()
    )
  );

-- El recurso en sí (PDF/audio/video) solo es legible por el paciente si le
-- fue asignado explícitamente, evitando exponer toda la biblioteca privada
-- del consultorio.
create policy "resource_library_portal_self_read" on public.resource_library
  for select using (
    exists (
      select 1 from public.assigned_resources ar
      join public.patients p on p.id = ar.patient_id
      where ar.resource_id = resource_library.id and p.user_id = auth.uid()
    )
  );

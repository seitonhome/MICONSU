-- Fix: recursión infinita en RLS entre patients y appointments
--
-- patients_select (rama "professional") subconsulta appointments para
-- verificar si el profesional tiene al menos una cita con ese paciente.
-- appointments_portal_self_read subconsulta patients para verificar si la
-- fila pertenece al paciente autenticado en el portal. Combinadas, Postgres
-- entra en un ciclo patients -> appointments -> patients que no puede
-- resolver: "infinite recursion detected in policy for relation patients".
--
-- Esto dejó completamente rota /dashboard/pacientes y /dashboard/agenda
-- para clinic_owner/assistant/receptionist/professional desde que se
-- aplicó 20260731100000_patient_portal.sql — los pacientes y citas se
-- podían crear pero nunca listar. Detectado en QA el 2026-08-05.
--
-- Se corrige moviendo el chequeo "¿esta fila es del paciente autenticado
-- en el portal?" a una función security definer (bypassa RLS de patients
-- al evaluarse, igual que current_clinic_id()/current_role()), rompiendo
-- el ciclo. Se aplica al resto de políticas *_portal_self_read que también
-- subconsultan patients directamente, por consistencia y para evitar el
-- mismo problema si en el futuro alguna de esas tablas es referenciada
-- desde otra política de patients.

create or replace function public.is_own_patient_row(p_patient_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.patients p
    where p.id = p_patient_id and p.user_id = auth.uid()
  );
$$;

revoke all on function public.is_own_patient_row(uuid) from public;
grant execute on function public.is_own_patient_row(uuid) to authenticated, anon;

drop policy if exists "appointments_portal_self_read" on public.appointments;
create policy "appointments_portal_self_read" on public.appointments
  for select using (public.is_own_patient_row(patient_id));

drop policy if exists "payment_intents_portal_self_read" on public.payment_intents;
create policy "payment_intents_portal_self_read" on public.payment_intents
  for select using (public.is_own_patient_row(patient_id));

drop policy if exists "consent_records_portal_self_read" on public.consent_records;
create policy "consent_records_portal_self_read" on public.consent_records
  for select using (public.is_own_patient_row(patient_id));

drop policy if exists "session_packages_portal_self_read" on public.session_packages;
create policy "session_packages_portal_self_read" on public.session_packages
  for select using (public.is_own_patient_row(patient_id));

drop policy if exists "assigned_resources_portal_self_read" on public.assigned_resources;
create policy "assigned_resources_portal_self_read" on public.assigned_resources
  for select using (public.is_own_patient_row(patient_id));

drop policy if exists "payments_portal_self_read" on public.payments;
create policy "payments_portal_self_read" on public.payments
  for select using (
    exists (
      select 1 from public.payment_intents pi
      where pi.id = payments.payment_intent_id
        and public.is_own_patient_row(pi.patient_id)
    )
  );

drop policy if exists "resource_library_portal_self_read" on public.resource_library;
create policy "resource_library_portal_self_read" on public.resource_library
  for select using (
    exists (
      select 1 from public.assigned_resources ar
      where ar.resource_id = resource_library.id
        and public.is_own_patient_row(ar.patient_id)
    )
  );

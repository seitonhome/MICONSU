-- El portal del paciente (app/portal/[patientId]/page.tsx) lee clinics y
-- clinic_branding directo con el cliente autenticado del paciente, pero las
-- únicas policies de SELECT existentes eran para staff (current_clinic_id())
-- o para visitantes públicos (is_published = true). Un paciente de una
-- clínica que aún no publicó su página pública no podía leer ni el nombre
-- ni el slug de su propia clínica — clinic quedaba null y el link "Ver
-- servicios de..." se armaba como /c/undefined.
--
-- Se agrega una función security definer (mismo patrón que
-- is_own_patient_row(), para no reabrir la recursión patients↔appointments)
-- y una policy de portal en clinics y clinic_branding.

create or replace function public.is_patient_of_clinic(p_clinic_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.patients p
    where p.clinic_id = p_clinic_id and p.user_id = auth.uid()
  );
$$;

revoke all on function public.is_patient_of_clinic(uuid) from public;
grant execute on function public.is_patient_of_clinic(uuid) to authenticated, anon;

create policy "clinics_portal_self_read" on public.clinics
  for select using (public.is_patient_of_clinic(id));

create policy "clinic_branding_portal_self_read" on public.clinic_branding
  for select using (public.is_patient_of_clinic(clinic_id));

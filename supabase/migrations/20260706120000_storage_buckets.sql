-- ============================================================================
-- Mi Consultorio Pro — Migración 07: Storage buckets
-- Dominio: bucket público "branding" (logos, portada, foto profesional,
-- credenciales públicas) y bucket privado "clinical-documents" (documentos de
-- pacientes, notas clínicas adjuntas, comprobantes de pago manual).
-- Convención de rutas: primer segmento del path = clinic_id, para poder
-- aislar por RLS sin tabla intermedia (storage.foldername(name) devuelve los
-- segmentos del path como text[]).
-- ============================================================================

insert into storage.buckets (id, name, public)
values ('branding', 'branding', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('clinical-documents', 'clinical-documents', false)
on conflict (id) do nothing;

-- ── branding: lectura pública, escritura solo del dueño de la clínica ──────

create policy "branding_public_read" on storage.objects
  for select using (bucket_id = 'branding');

create policy "branding_owner_write" on storage.objects
  for insert with check (
    bucket_id = 'branding'
    and (storage.foldername(name))[1] = public.current_clinic_id()::text
    and public.current_role() = 'clinic_owner'
  );

create policy "branding_owner_update" on storage.objects
  for update using (
    bucket_id = 'branding'
    and (storage.foldername(name))[1] = public.current_clinic_id()::text
    and public.current_role() = 'clinic_owner'
  );

create policy "branding_owner_delete" on storage.objects
  for delete using (
    bucket_id = 'branding'
    and (storage.foldername(name))[1] = public.current_clinic_id()::text
    and public.current_role() = 'clinic_owner'
  );

-- ── clinical-documents: privado, solo staff de la misma clínica ───────────
-- La distinción administrativo/clínico (patient_documents.is_clinical) se
-- aplica en la tabla, no aquí; a nivel de Storage cualquier miembro del staff
-- de la clínica puede leer el archivo (la fila de patient_documents es la que
-- filtra qué puede *listar* cada rol desde la aplicación).

create policy "clinical_documents_staff_read" on storage.objects
  for select using (
    bucket_id = 'clinical-documents'
    and (storage.foldername(name))[1] = public.current_clinic_id()::text
  );

create policy "clinical_documents_staff_write" on storage.objects
  for insert with check (
    bucket_id = 'clinical-documents'
    and (storage.foldername(name))[1] = public.current_clinic_id()::text
    and public.current_role() in ('clinic_owner','assistant','receptionist','professional')
  );

create policy "clinical_documents_staff_delete" on storage.objects
  for delete using (
    bucket_id = 'clinical-documents'
    and (storage.foldername(name))[1] = public.current_clinic_id()::text
    and public.current_role() in ('clinic_owner','professional')
  );

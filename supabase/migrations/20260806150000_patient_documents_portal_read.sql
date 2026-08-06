-- Le da al paciente, desde su portal, acceso de solo lectura a los
-- documentos administrativos (is_clinical = false) que el staff subió a su
-- ficha. Los documentos clínicos (historias, resultados) siguen siendo
-- visibles solo para el staff — esa distinción ya existía en la tabla
-- (patient_documents.is_clinical), solo faltaba exponerla al paciente.
--
-- Reutiliza is_own_patient_row() (creada en la migración que arregló la
-- recursión infinita entre patients y appointments) en vez de una
-- subconsulta directa a patients, para no reabrir ese mismo problema.

create policy "patient_documents_portal_self_read" on public.patient_documents
  for select using (
    not is_clinical
    and deleted_at is null
    and public.is_own_patient_row(patient_id)
  );

-- El paciente también necesita poder leer el archivo en sí (no solo la fila
-- de metadata) para poder generar una signed URL desde el portal.
create policy "clinical_documents_portal_self_read" on storage.objects
  for select using (
    bucket_id = 'clinical-documents'
    and exists (
      select 1 from public.patient_documents pd
      where pd.file_url = storage.objects.name
        and not pd.is_clinical
        and pd.deleted_at is null
        and public.is_own_patient_row(pd.patient_id)
    )
  );

-- ============================================================================
-- Mi Consultorio Pro — Revocar consentimiento desde el portal del paciente
-- Hasta ahora solo se podía aceptar un consentimiento, nunca retirarlo —
-- laguna frente al derecho de revocación de la Ley 1581 (Habeas Data).
-- No se agrega política de UPDATE para "authenticated": la revocación se
-- escribe siempre desde el servidor con el cliente admin (mismo patrón que
-- el insert de consent_records), para que el resto de columnas de evidencia
-- (accepted_at, ip_address, document_version) sigan siendo de solo lectura
-- para el paciente incluso desde su propia sesión del portal.
-- ============================================================================

alter table public.consent_records
  add column if not exists revoked_at timestamptz;

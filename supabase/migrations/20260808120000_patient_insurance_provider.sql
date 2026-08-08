-- ============================================================================
-- Mi Consultorio Pro — Campo EPS/aseguradora en la ficha del paciente
-- Contexto colombiano de salud ausente hasta ahora en patients.
-- ============================================================================

alter table public.patients
  add column if not exists insurance_provider text;

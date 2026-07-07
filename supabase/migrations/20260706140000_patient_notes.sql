-- ============================================================================
-- Mi Consultorio Pro — Migración 09: notas administrativas del paciente
-- Campo listado en el brief ("Pacientes / Consultantes" → notas
-- administrativas) que faltaba en la migración 01. Es texto administrativo
-- general (no clínico); las notas clínicas viven en el módulo clínico
-- protegido de Fase 2, con su propia tabla y auditoría.
-- ============================================================================

alter table public.patients
  add column administrative_notes text;

-- ============================================================================
-- Mi Consultorio Pro — Migración 08: slug global de profesional
-- La página pública del profesional vive en /p/[proSlug] (sin prefijo de
-- clínica, ver docs/00-ARQUITECTURA-Y-PLAN.md §3). Eso exige que el slug sea
-- único en toda la plataforma, no solo por clínica. El unique(clinic_id, slug)
-- de la migración 01 se mantiene (no estorba); este agrega la restricción
-- global que realmente usa la ruta pública.
-- ============================================================================

alter table public.professionals
  add constraint professionals_slug_key unique (slug);

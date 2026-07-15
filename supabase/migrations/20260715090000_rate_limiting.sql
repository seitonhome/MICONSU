-- ============================================================================
-- Mi Consultorio Pro — Migración 14: Rate limiting básico
-- Dominio: rate_limit_attempts
-- Contador simple por clave (ej. "login:203.0.113.5") con ventana de tiempo
-- evaluada en la aplicación (lib/security/rate-limit.ts). Solo el cliente
-- admin (service_role) escribe y lee aquí — nunca se expone vía RLS a
-- anon/authenticated, porque la clave puede incluir IPs/emails.
-- ============================================================================

create table public.rate_limit_attempts (
  id uuid primary key default gen_random_uuid(),
  bucket_key text not null,
  created_at timestamptz not null default now()
);

create index idx_rate_limit_attempts_bucket_key on public.rate_limit_attempts (bucket_key, created_at desc);

alter table public.rate_limit_attempts enable row level security;

-- Sin políticas para anon/authenticated: solo accesible vía service_role
-- desde Server Actions, que es exactamente donde debe evaluarse el límite.

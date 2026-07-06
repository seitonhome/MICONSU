-- ============================================================================
-- Mi Consultorio Pro — Migración 06: Modo demo comercial
-- Dominio: demo_data_profiles, sales_demo_sessions
-- El modo demo reutiliza las mismas tablas de producción (clinics.is_demo =
-- true) para no duplicar arquitectura; estas dos tablas solo indexan qué
-- clínica demo corresponde a cada vertical y registran el uso comercial.
-- ============================================================================

create table public.demo_data_profiles (
  id uuid primary key default gen_random_uuid(),
  vertical_key text not null unique check (vertical_key in (
    'medico','odontologo','psicologo','alternativa','bienestar'
  )),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  display_name text not null,
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_demo_data_profiles_updated_at
  before update on public.demo_data_profiles
  for each row execute function public.set_updated_at();

alter table public.demo_data_profiles enable row level security;

-- Público: necesario para resolver /demo/[vertical] -> clinic_id sin sesión.
create policy "demo_data_profiles_public_read" on public.demo_data_profiles
  for select using (is_active);

create policy "demo_data_profiles_manage_super_admin" on public.demo_data_profiles
  for all using (public.is_super_admin()) with check (public.is_super_admin());

-- ── Tabla: sales_demo_sessions ────────────────────────────────────────────
-- Registro comercial de uso de las demos (para métricas de conversión del
-- panel superadmin). Cualquier visitante puede generar una fila (anon
-- insert), pero solo el equipo del producto puede leerlas.

create table public.sales_demo_sessions (
  id uuid primary key default gen_random_uuid(),
  vertical_key text not null references public.demo_data_profiles(vertical_key),
  viewer_identifier text,
  referrer text,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  notes text,
  created_at timestamptz not null default now()
);

create index idx_sales_demo_sessions_vertical_key on public.sales_demo_sessions (vertical_key);

alter table public.sales_demo_sessions enable row level security;

create policy "sales_demo_sessions_insert_public" on public.sales_demo_sessions
  for insert with check (true);

create policy "sales_demo_sessions_select_super_admin" on public.sales_demo_sessions
  for select using (public.is_super_admin());

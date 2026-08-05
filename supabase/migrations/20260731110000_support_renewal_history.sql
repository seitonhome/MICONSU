-- ── Historial de renovaciones del Plan Continuidad Clínica ──────────────
-- support_subscriptions solo guarda el estado actual; esta tabla es un log
-- append-only de cada cambio de plan/estado/vigencia, para poder responder
-- "¿cuándo renovó este consultorio y qué le cambiamos?" sin depender de
-- auditoría genérica.

create table public.support_subscription_renewals (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  support_plan_id uuid not null references public.support_plans(id) on delete restrict,
  status text not null check (status in ('active','expiring_soon','expired','suspended')),
  started_at date not null,
  ends_at date,
  changed_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create index idx_support_subscription_renewals_clinic_id on public.support_subscription_renewals (clinic_id, created_at);

alter table public.support_subscription_renewals enable row level security;

create policy "support_subscription_renewals_read" on public.support_subscription_renewals
  for select using (
    public.is_super_admin()
    or (clinic_id = public.current_clinic_id() and public.current_role() = 'clinic_owner')
  );

create policy "support_subscription_renewals_insert" on public.support_subscription_renewals
  for insert with check (public.is_super_admin());

-- ── Mi Consultorio Pro pasa de "pago único de por vida" a plan anual ────
-- $39 USD/año, incluye soporte (Plan Continuidad Clínica), se renueva cada
-- año. Si no se renueva, el consultorio deja de poder operar la app (agenda,
-- pacientes, pagos, etc.) pero NUNCA se borran ni se ocultan sus datos: el
-- dueño puede seguir iniciando sesión para descargarlos (ver
-- app/(app)/layout.tsx y app/api/export/clinic-data/route.ts).

alter table public.licenses add column ends_at timestamptz;

create or replace function public.create_clinic_and_assign_owner(
  p_commercial_name text,
  p_slug text
)
returns public.clinics
language plpgsql
security definer
set search_path = public
as $$
declare
  v_clinic public.clinics;
  v_support_plan_id uuid;
  v_module public.module_key;
begin
  if auth.uid() is null then
    raise exception 'Se requiere sesión activa.';
  end if;

  if exists (select 1 from public.profiles where id = auth.uid() and clinic_id is not null) then
    raise exception 'El usuario ya pertenece a un consultorio.';
  end if;

  insert into public.clinics (commercial_name, slug)
  values (p_commercial_name, p_slug)
  returning * into v_clinic;

  update public.profiles
  set clinic_id = v_clinic.id, role = 'clinic_owner'
  where id = auth.uid();

  insert into public.clinic_branding (clinic_id)
  values (v_clinic.id);

  -- Plan anual: 1 año de acceso completo desde el registro/compra.
  insert into public.licenses (
    clinic_id, license_type, professionals_allowed, locations_allowed, status, purchased_at, ends_at
  ) values (
    v_clinic.id, 'centro', 50, 20, 'active', now(), now() + interval '1 year'
  );

  select id into v_support_plan_id from public.support_plans where plan_key = 'centro';
  if v_support_plan_id is not null then
    insert into public.support_subscriptions (clinic_id, support_plan_id, status, started_at, ends_at)
    values (v_clinic.id, v_support_plan_id, 'active', current_date, (current_date + interval '1 year')::date);
  end if;

  for v_module in select unnest(enum_range(null::public.module_key)) loop
    insert into public.enabled_modules (clinic_id, module_key, is_active, activated_at)
    values (v_clinic.id, v_module, true, now())
    on conflict (clinic_id, module_key) do nothing;
  end loop;

  return v_clinic;
end;
$$;

-- ── Backfill: consultorios que ya tenían licencia sin ends_at ───────────
-- Les damos 1 año desde su fecha de compra (o desde hoy si no hay
-- purchased_at), para que no queden bloqueados de un día para otro por un
-- cambio de modelo comercial retroactivo.
update public.licenses
set ends_at = coalesce(purchased_at, now()) + interval '1 year'
where ends_at is null;

update public.support_subscriptions
set ends_at = (coalesce(started_at, current_date) + interval '1 year')::date
where ends_at is null;

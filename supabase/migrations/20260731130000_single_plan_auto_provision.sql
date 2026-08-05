-- ── Mi Consultorio Pro es un solo plan completo ─────────────────────────
-- Se vende como pago único ($39, sin mensualidad, "todo incluido" — ver
-- landing en seiton/mi-consultorio-pro), no como planes escalonados con
-- upsells manuales. Antes de esta migración, un consultorio recién
-- registrado no tenía fila en `licenses`, así que getClinicEntitlements()
-- lo trataba como "sin nada por encima de lo básico" hasta que un
-- superadmin le asignara licencia a mano en /admin/consultorios/[id] — eso
-- significaba que nadie que se autoregistraba tenía en realidad acceso a
-- paquetes, procesos, talleres grupales, recursos ni módulo clínico pese a
-- que la landing los vende como incluidos.
--
-- Esta migración hace que create_clinic_and_assign_owner() otorgue de una
-- vez licencia activa de tope, todos los módulos y soporte activo sin fecha
-- de vencimiento, para que el registro standalone equivalga a "acceso
-- completo inmediato" tal como promete la landing. license_type sigue
-- usando el enum existente ('esencial'/'profesional'/'centro') para no
-- romper el resto del esquema, pero 'centro' pasa a ser simplemente "el
-- plan único" — ya no representa un tier superior con upsell.

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

  insert into public.licenses (
    clinic_id, license_type, professionals_allowed, locations_allowed, status, purchased_at
  ) values (
    v_clinic.id, 'centro', 50, 20, 'active', now()
  );

  select id into v_support_plan_id from public.support_plans where plan_key = 'centro';
  if v_support_plan_id is not null then
    insert into public.support_subscriptions (clinic_id, support_plan_id, status, started_at, ends_at)
    values (v_clinic.id, v_support_plan_id, 'active', current_date, null);
  end if;

  for v_module in select unnest(enum_range(null::public.module_key)) loop
    insert into public.enabled_modules (clinic_id, module_key, is_active, activated_at)
    values (v_clinic.id, v_module, true, now())
    on conflict (clinic_id, module_key) do nothing;
  end loop;

  return v_clinic;
end;
$$;

-- ── Backfill: consultorios ya registrados antes de esta migración ───────
-- Mismo criterio: si compraron/se registraron bajo el modelo de un solo
-- plan, deben quedar con acceso completo igual que los nuevos. No pisa
-- licencias que el superadmin ya haya configurado manualmente (ON CONFLICT
-- DO NOTHING dejaría la fila existente intacta), así que si alguna clínica
-- fue suspendida a propósito, esta migración no la reactiva.
insert into public.licenses (clinic_id, license_type, professionals_allowed, locations_allowed, status, purchased_at)
select c.id, 'centro', 50, 20, 'active', now()
from public.clinics c
where not exists (select 1 from public.licenses l where l.clinic_id = c.id)
  and c.deleted_at is null
  and c.is_demo = false;

insert into public.support_subscriptions (clinic_id, support_plan_id, status, started_at, ends_at)
select c.id, sp.id, 'active', current_date, null
from public.clinics c
cross join lateral (select id from public.support_plans where plan_key = 'centro' limit 1) sp
where not exists (select 1 from public.support_subscriptions s where s.clinic_id = c.id)
  and c.deleted_at is null
  and c.is_demo = false;

insert into public.enabled_modules (clinic_id, module_key, is_active, activated_at)
select c.id, m.module_key, true, now()
from public.clinics c
cross join lateral (select unnest(enum_range(null::public.module_key)) as module_key) m
where c.deleted_at is null
  and c.is_demo = false
on conflict (clinic_id, module_key) do nothing;

-- ── Fix crítico: el registro de un consultorio nuevo estaba roto ────────
-- prevent_self_privilege_escalation() bloqueaba CUALQUIER cambio de
-- clinic_id/role hecho por el propio usuario, incluida la asignación
-- inicial (clinic_id NULL -> nuevo consultorio) que hace
-- create_clinic_and_assign_owner() al registrarse — el único camino
-- legítimo para eso, según su propio comentario. Resultado: todo intento
-- real de self-register fallaba con "No puedes modificar tu propio rol o
-- consultorio."
--
-- Fix: el trigger solo debe bloquear una vez que el usuario YA pertenece
-- a un consultorio (old.clinic_id is not null) — un usuario recién creado
-- sin consultorio no tiene nada que "escalar". La propia RPC ya impide
-- que un usuario con clinic_id no nulo la vuelva a llamar, así que el
-- caso de escalar/cambiar de consultorio una vez asignado sigue bloqueado
-- igual que antes.

create or replace function public.prevent_self_privilege_escalation()
returns trigger
language plpgsql
as $$
begin
  if auth.uid() = old.id and old.clinic_id is not null and public.current_role() <> 'super_admin' then
    if new.role <> old.role or new.clinic_id is distinct from old.clinic_id then
      raise exception 'No puedes modificar tu propio rol o consultorio.';
    end if;
  end if;
  return new;
end;
$$;

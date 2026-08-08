-- ============================================================================
-- Mi Consultorio Pro — Bloqueos de horario recurrentes
-- Hasta ahora solo se podían bloquear rangos puntuales (una fecha exacta) —
-- un bloqueo repetitivo ("todos los miércoles") había que recrearlo semana
-- a semana a mano. Se agrega un modo recurrente por día de la semana, con
-- fecha de inicio y fin de vigencia opcionales.
-- ============================================================================

alter table public.blocked_times
  add column if not exists is_recurring boolean not null default false,
  add column if not exists day_of_week smallint check (day_of_week between 0 and 6),
  add column if not exists start_time time,
  add column if not exists end_time time,
  add column if not exists recurrence_ends_at date;

-- ends_at solo es obligatorio para bloqueos puntuales; uno recurrente usa
-- day_of_week/start_time/end_time en su lugar.
alter table public.blocked_times alter column ends_at drop not null;
alter table public.blocked_times drop constraint if exists blocked_times_ends_at_check;
alter table public.blocked_times add constraint blocked_times_range_check check (
  (not is_recurring and ends_at is not null and ends_at > starts_at)
  or
  (is_recurring and day_of_week is not null and start_time is not null and end_time is not null and end_time > start_time)
);

-- is_range_blocked ahora también evalúa bloqueos recurrentes: mismo día de
-- la semana, traslape de horas, y dentro de la ventana de vigencia
-- (starts_at = desde cuándo aplica, recurrence_ends_at = hasta cuándo, o
-- indefinido si es null). Usa los componentes de fecha/hora tal como vienen
-- en el timestamp, igual que el resto del sistema de horarios (sin
-- conversión explícita de zona horaria — mismo criterio que availability_rules).
create or replace function public.is_range_blocked(
  p_professional_id uuid,
  p_clinic_id uuid,
  p_starts_at timestamptz,
  p_ends_at timestamptz
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.blocked_times bt
    where (bt.professional_id = p_professional_id or bt.professional_id is null)
      and bt.clinic_id = p_clinic_id
      and (
        (
          not bt.is_recurring
          and tstzrange(bt.starts_at, bt.ends_at) && tstzrange(p_starts_at, p_ends_at)
        )
        or
        (
          bt.is_recurring
          and extract(dow from p_starts_at) = bt.day_of_week
          and p_starts_at::time < bt.end_time
          and p_ends_at::time > bt.start_time
          and p_starts_at >= bt.starts_at
          and (bt.recurrence_ends_at is null or p_starts_at::date <= bt.recurrence_ends_at)
        )
      )
  );
$$;

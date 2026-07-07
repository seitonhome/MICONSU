import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";

type Client = SupabaseClient<Database>;

/**
 * Calcula horarios disponibles para un profesional en una fecha dada.
 * No lee `appointments` ni `blocked_times` directamente (RLS no expone esas
 * tablas a `anon`); en su lugar usa las funciones públicas de disponibilidad
 * `has_conflicting_appointment` / `is_range_blocked` (security definer),
 * candidato por candidato, tal como prevé el comentario de la migración 02.
 */
export async function getAvailableSlots(
  supabase: Client,
  params: {
    clinicId: string;
    professionalId: string;
    durationMinutes: number;
    date: string;
    minAdvanceHours: number;
  },
): Promise<string[]> {
  const dayOfWeek = new Date(`${params.date}T00:00:00`).getDay();

  const { data: rules } = await supabase
    .from("availability_rules")
    .select("start_time, end_time, buffer_minutes")
    .eq("professional_id", params.professionalId)
    .eq("day_of_week", dayOfWeek)
    .is("deleted_at", null);

  if (!rules || rules.length === 0) return [];

  const now = new Date();
  const minStart = new Date(now.getTime() + params.minAdvanceHours * 3600000);

  const candidates: { start: Date; end: Date }[] = [];
  for (const rule of rules) {
    let cursor = new Date(`${params.date}T${rule.start_time}`);
    const ruleEnd = new Date(`${params.date}T${rule.end_time}`);
    const step = params.durationMinutes + (rule.buffer_minutes ?? 0);

    while (cursor.getTime() + params.durationMinutes * 60000 <= ruleEnd.getTime()) {
      const slotEnd = new Date(cursor.getTime() + params.durationMinutes * 60000);
      if (cursor >= minStart) candidates.push({ start: cursor, end: slotEnd });
      cursor = new Date(cursor.getTime() + step * 60000);
    }
  }

  const checked = await Promise.all(
    candidates.map(async (slot) => {
      const [{ data: hasConflict }, { data: isBlocked }] = await Promise.all([
        supabase.rpc("has_conflicting_appointment", {
          p_professional_id: params.professionalId,
          p_starts_at: slot.start.toISOString(),
          p_ends_at: slot.end.toISOString(),
        }),
        supabase.rpc("is_range_blocked", {
          p_professional_id: params.professionalId,
          p_clinic_id: params.clinicId,
          p_starts_at: slot.start.toISOString(),
          p_ends_at: slot.end.toISOString(),
        }),
      ]);
      return { time: slot.start.toTimeString().slice(0, 5), free: !hasConflict && !isBlocked };
    }),
  );

  return Array.from(new Set(checked.filter((c) => c.free).map((c) => c.time))).sort();
}

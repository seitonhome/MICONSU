"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/session";

export type ScheduleActionState = { error?: string; success?: boolean };

async function ownerOrProfessionalClinicId() {
  const profile = await requireRole(["clinic_owner", "professional"]);
  const supabase = await createClient();
  return { clinicId: profile.clinicId!, supabase };
}

export async function addAvailabilityRule(
  _prev: ScheduleActionState | undefined,
  formData: FormData,
): Promise<ScheduleActionState> {
  const { clinicId, supabase } = await ownerOrProfessionalClinicId();
  const professionalId = formData.get("professional_id") as string;
  const startTime = formData.get("start_time") as string;
  const endTime = formData.get("end_time") as string;
  const days = formData.getAll("days").map((d) => Number(d));

  if (!professionalId || days.length === 0 || !startTime || !endTime) {
    return { error: "Selecciona al menos un día y un horario válido." };
  }

  const { error } = await supabase.from("availability_rules").insert(
    days.map((day) => ({
      clinic_id: clinicId,
      professional_id: professionalId,
      day_of_week: day,
      start_time: startTime,
      end_time: endTime,
    })),
  );

  if (error) return { error: "No pudimos guardar el horario. Verifica que la hora de fin sea mayor a la de inicio." };

  revalidatePath("/dashboard/configuracion/horarios");
  return { success: true };
}

export async function deleteAvailabilityRule(id: string): Promise<void> {
  const { supabase } = await ownerOrProfessionalClinicId();
  await supabase.from("availability_rules").delete().eq("id", id);
  revalidatePath("/dashboard/configuracion/horarios");
}

export async function addBlockedTime(
  _prev: ScheduleActionState | undefined,
  formData: FormData,
): Promise<ScheduleActionState> {
  const { clinicId, supabase } = await ownerOrProfessionalClinicId();
  const professionalId = (formData.get("professional_id") as string) || null;
  const reason = (formData.get("reason") as string) || null;
  const isRecurring = formData.get("is_recurring") === "on";

  if (isRecurring) {
    const dayOfWeek = Number(formData.get("day_of_week"));
    const startTime = formData.get("recurring_start_time") as string;
    const endTime = formData.get("recurring_end_time") as string;
    const fromDate = (formData.get("recurrence_from") as string) || new Date().toISOString().slice(0, 10);
    const untilDate = (formData.get("recurrence_until") as string) || null;

    if (Number.isNaN(dayOfWeek) || !startTime || !endTime) {
      return { error: "Selecciona un día de la semana y un rango de horas válido." };
    }
    if (endTime <= startTime) return { error: "La hora de fin debe ser mayor a la de inicio." };

    const { error } = await supabase.from("blocked_times").insert({
      clinic_id: clinicId,
      professional_id: professionalId,
      is_recurring: true,
      day_of_week: dayOfWeek,
      start_time: startTime,
      end_time: endTime,
      starts_at: new Date(`${fromDate}T00:00:00`).toISOString(),
      recurrence_ends_at: untilDate,
      reason,
    });

    if (error) return { error: "No pudimos guardar el bloqueo recurrente." };
    revalidatePath("/dashboard/configuracion/horarios");
    return { success: true };
  }

  const date = formData.get("date") as string;
  const startTime = formData.get("start_time") as string;
  const endTime = formData.get("end_time") as string;

  if (!date || !startTime || !endTime) return { error: "Completa la fecha y el rango de horas." };

  const startsAt = new Date(`${date}T${startTime}:00`);
  const endsAt = new Date(`${date}T${endTime}:00`);
  if (endsAt <= startsAt) return { error: "La hora de fin debe ser mayor a la de inicio." };

  const { error } = await supabase.from("blocked_times").insert({
    clinic_id: clinicId,
    professional_id: professionalId,
    starts_at: startsAt.toISOString(),
    ends_at: endsAt.toISOString(),
    reason,
  });

  if (error) return { error: "No pudimos guardar el bloqueo." };

  revalidatePath("/dashboard/configuracion/horarios");
  return { success: true };
}

export async function deleteBlockedTime(id: string): Promise<void> {
  const { supabase } = await ownerOrProfessionalClinicId();
  await supabase.from("blocked_times").delete().eq("id", id);
  revalidatePath("/dashboard/configuracion/horarios");
}

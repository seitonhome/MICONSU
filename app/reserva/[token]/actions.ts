"use server";

import { createAdminClient } from "@/lib/supabase/server";
import { notifyAppointment } from "@/lib/notifications/notify";
import { getAvailableSlots } from "@/lib/booking/slots";

export type ManageBookingState = { error?: string; success?: boolean };

export async function cancelPublicAppointment(
  token: string,
  _prev: ManageBookingState | undefined,
  formData: FormData,
): Promise<ManageBookingState> {
  const admin = createAdminClient();

  const { data: appointment } = await admin
    .from("appointments")
    .select("id, status, starts_at, service_id")
    .eq("booking_token", token)
    .single();

  if (!appointment) return { error: "No encontramos tu cita." };
  if (["cancelled", "completed", "no_show", "expired"].includes(appointment.status)) {
    return { error: "Esta cita ya no se puede cancelar." };
  }

  const { data: service } = await admin
    .from("services")
    .select("max_cancel_hours")
    .eq("id", appointment.service_id)
    .single();

  const hoursUntil = (new Date(appointment.starts_at).getTime() - Date.now()) / 3600000;
  if (service && service.max_cancel_hours > 0 && hoursUntil < service.max_cancel_hours) {
    return {
      error: `Esta cita solo se puede cancelar con al menos ${service.max_cancel_hours} horas de anticipación. Contacta al consultorio directamente.`,
    };
  }

  const reason = (formData.get("reason") as string) || "Cancelada por el paciente";

  const { error } = await admin
    .from("appointments")
    .update({ status: "cancelled", cancellation_reason: reason })
    .eq("id", appointment.id);

  if (error) return { error: "No pudimos cancelar tu cita. Intenta de nuevo." };

  await notifyAppointment(admin, appointment.id, "appointment_cancelled");

  return { success: true };
}

export async function fetchRescheduleSlotsAction(token: string, date: string): Promise<string[]> {
  const admin = createAdminClient();

  const { data: appointment } = await admin
    .from("appointments")
    .select("clinic_id, professional_id, service_id")
    .eq("booking_token", token)
    .single();
  if (!appointment) return [];

  const { data: service } = await admin
    .from("services")
    .select("duration_minutes, min_advance_hours")
    .eq("id", appointment.service_id)
    .single();
  if (!service) return [];

  return getAvailableSlots(admin, {
    clinicId: appointment.clinic_id,
    professionalId: appointment.professional_id,
    durationMinutes: service.duration_minutes,
    date,
    minAdvanceHours: service.min_advance_hours ?? 0,
  });
}

export async function reschedulePublicAppointment(
  token: string,
  date: string,
  time: string,
): Promise<ManageBookingState> {
  const admin = createAdminClient();

  const { data: appointment } = await admin
    .from("appointments")
    .select("id, status, professional_id, clinic_id, service_id")
    .eq("booking_token", token)
    .single();
  if (!appointment) return { error: "No encontramos tu cita." };
  if (["cancelled", "completed", "no_show", "expired"].includes(appointment.status)) {
    return { error: "Esta cita ya no se puede reprogramar." };
  }

  const { data: service } = await admin
    .from("services")
    .select("duration_minutes")
    .eq("id", appointment.service_id)
    .single();
  if (!service) return { error: "No encontramos el servicio de esta cita." };

  const startsAt = new Date(`${date}T${time}:00`);
  const endsAt = new Date(startsAt.getTime() + service.duration_minutes * 60000);

  const { data: hasConflict } = await admin.rpc("has_conflicting_appointment", {
    p_professional_id: appointment.professional_id,
    p_starts_at: startsAt.toISOString(),
    p_ends_at: endsAt.toISOString(),
    p_exclude_appointment_id: appointment.id,
  });
  if (hasConflict) return { error: "Ese horario ya no está disponible. Elige otro." };

  const { data: isBlocked } = await admin.rpc("is_range_blocked", {
    p_professional_id: appointment.professional_id,
    p_clinic_id: appointment.clinic_id,
    p_starts_at: startsAt.toISOString(),
    p_ends_at: endsAt.toISOString(),
  });
  if (isBlocked) return { error: "Ese horario ya no está disponible. Elige otro." };

  const { error } = await admin
    .from("appointments")
    .update({ starts_at: startsAt.toISOString(), ends_at: endsAt.toISOString(), status: "confirmed" })
    .eq("id", appointment.id);
  if (error) return { error: "No pudimos reprogramar tu cita. Intenta de nuevo." };

  await notifyAppointment(admin, appointment.id, "appointment_rescheduled");

  return { success: true };
}

"use server";

import { createAdminClient } from "@/lib/supabase/server";
import { notifyAppointment } from "@/lib/notifications/notify";

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

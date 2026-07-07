"use server";

import { revalidatePath } from "next/cache";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/session";
import { notifyAppointment } from "@/lib/notifications/notify";
import type { Database } from "@/lib/supabase/types";

export type AgendaActionState = { error?: string; success?: boolean };

const STAFF_ROLES = ["clinic_owner", "assistant", "receptionist", "professional"] as const;

async function staffClinicId() {
  const profile = await requireRole([...STAFF_ROLES]);
  const supabase = await createClient();
  return { clinicId: profile.clinicId!, profileId: profile.id, supabase };
}

export async function createAppointment(
  _prev: AgendaActionState | undefined,
  formData: FormData,
): Promise<AgendaActionState> {
  const { clinicId, profileId, supabase } = await staffClinicId();

  const professionalId = formData.get("professional_id") as string;
  const serviceId = formData.get("service_id") as string;
  const locationId = (formData.get("location_id") as string) || null;
  const date = formData.get("date") as string;
  const time = formData.get("time") as string;
  const modality = formData.get("modality") as "in_person" | "virtual";
  const patientMode = formData.get("patient_mode") as string;

  if (!professionalId || !serviceId || !date || !time) {
    return { error: "Completa profesional, servicio, fecha y hora." };
  }

  const { data: service } = await supabase
    .from("services")
    .select("duration_minutes, price, deposit_amount")
    .eq("id", serviceId)
    .single();
  if (!service) return { error: "El servicio seleccionado no existe." };

  const startsAt = new Date(`${date}T${time}:00`);
  const endsAt = new Date(startsAt.getTime() + service.duration_minutes * 60000);

  let patientId = formData.get("patient_id") as string;

  if (patientMode === "quick") {
    const fullName = (formData.get("new_patient_name") as string)?.trim();
    if (!fullName) return { error: "El nombre del paciente es obligatorio." };

    const { data: newPatient, error: patientError } = await supabase
      .from("patients")
      .insert({
        clinic_id: clinicId,
        full_name: fullName,
        phone: (formData.get("new_patient_phone") as string) || null,
        email: (formData.get("new_patient_email") as string) || null,
      })
      .select("id")
      .single();

    if (patientError || !newPatient) return { error: "No pudimos registrar al paciente." };
    patientId = newPatient.id;
  }

  if (!patientId) return { error: "Selecciona o registra un paciente." };

  const { data: hasConflict } = await supabase.rpc("has_conflicting_appointment", {
    p_professional_id: professionalId,
    p_starts_at: startsAt.toISOString(),
    p_ends_at: endsAt.toISOString(),
  });
  if (hasConflict) return { error: "Ese profesional ya tiene una cita en ese horario." };

  const { data: isBlocked } = await supabase.rpc("is_range_blocked", {
    p_professional_id: professionalId,
    p_clinic_id: clinicId,
    p_starts_at: startsAt.toISOString(),
    p_ends_at: endsAt.toISOString(),
  });
  if (isBlocked) return { error: "Ese horario está bloqueado para el profesional." };

  const { error } = await supabase.from("appointments").insert({
    clinic_id: clinicId,
    patient_id: patientId,
    professional_id: professionalId,
    service_id: serviceId,
    location_id: locationId,
    starts_at: startsAt.toISOString(),
    ends_at: endsAt.toISOString(),
    modality,
    status: "confirmed",
    price: service.price,
    deposit_required: service.deposit_amount ?? 0,
    created_by: profileId,
  });

  if (error) return { error: "No pudimos crear la cita." };

  revalidatePath("/dashboard/agenda");
  return { success: true };
}

const ALLOWED_STATUSES: Database["public"]["Enums"]["appointment_status"][] = [
  "confirmed",
  "checked_in",
  "in_progress",
  "completed",
  "cancelled",
  "no_show",
];

export async function updateAppointmentStatus(
  id: string,
  status: Database["public"]["Enums"]["appointment_status"],
): Promise<void> {
  if (!ALLOWED_STATUSES.includes(status)) return;
  const { supabase } = await staffClinicId();
  await supabase.from("appointments").update({ status }).eq("id", id);
  revalidatePath("/dashboard/agenda");
}

export async function cancelAppointment(id: string, reason: string): Promise<void> {
  const { profileId, supabase } = await staffClinicId();
  await supabase
    .from("appointments")
    .update({ status: "cancelled", cancellation_reason: reason || null, cancelled_by: profileId })
    .eq("id", id);

  await notifyAppointment(createAdminClient(), id, "appointment_cancelled");

  revalidatePath("/dashboard/agenda");
}

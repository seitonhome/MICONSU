"use server";

import { revalidatePath } from "next/cache";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/session";
import { sendEmail } from "@/lib/notifications/email";
import { notifyAppointment } from "@/lib/notifications/notify";

export type WaitlistActionState = { error?: string; success?: boolean };

const STAFF_ROLES = ["clinic_owner", "assistant", "receptionist", "professional"] as const;

async function staffClinicId() {
  const profile = await requireRole([...STAFF_ROLES]);
  const supabase = await createClient();
  return { clinicId: profile.clinicId!, profileId: profile.id, supabase };
}

export async function addWaitlistEntry(
  _prev: WaitlistActionState | undefined,
  formData: FormData,
): Promise<WaitlistActionState> {
  const { clinicId, supabase } = await staffClinicId();
  const patientMode = formData.get("patient_mode") as string;
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
      })
      .select("id")
      .single();

    if (patientError || !newPatient) return { error: "No pudimos registrar al paciente." };
    patientId = newPatient.id;
  }

  if (!patientId) return { error: "Selecciona o registra un paciente." };

  const { error } = await supabase.from("waitlist_entries").insert({
    clinic_id: clinicId,
    patient_id: patientId,
    service_id: (formData.get("service_id") as string) || null,
    professional_id: (formData.get("professional_id") as string) || null,
    date_range_start: (formData.get("date_range_start") as string) || null,
    date_range_end: (formData.get("date_range_end") as string) || null,
    time_preference: (formData.get("time_preference") as string) || null,
    priority: Number(formData.get("priority")) || 0,
  });

  if (error) return { error: "No pudimos agregar a la lista de espera." };

  revalidatePath("/dashboard/lista-espera");
  return { success: true };
}

export async function markWaitlistStatus(
  id: string,
  status: "waiting" | "notified" | "booked" | "expired" | "cancelled",
): Promise<void> {
  const { supabase } = await staffClinicId();
  await supabase
    .from("waitlist_entries")
    .update({ status, ...(status === "notified" ? { notified_at: new Date().toISOString() } : {}) })
    .eq("id", id);
  revalidatePath("/dashboard/lista-espera");
}

export async function deleteWaitlistEntry(id: string): Promise<void> {
  const { supabase } = await staffClinicId();
  await supabase.from("waitlist_entries").delete().eq("id", id);
  revalidatePath("/dashboard/lista-espera");
}

export async function notifyWaitlistEntry(id: string): Promise<{ error?: string }> {
  const { clinicId, supabase } = await staffClinicId();

  const { data: entry } = await supabase
    .from("waitlist_entries")
    .select("patient_id, service_id, professional_id")
    .eq("id", id)
    .single();
  if (!entry) return { error: "No encontramos este registro." };

  const [{ data: patient }, { data: clinic }, { data: service }, { data: professional }] = await Promise.all([
    supabase.from("patients").select("full_name, email").eq("id", entry.patient_id).single(),
    supabase.from("clinics").select("commercial_name").eq("id", clinicId).single(),
    entry.service_id ? supabase.from("services").select("name").eq("id", entry.service_id).single() : Promise.resolve({ data: null }),
    entry.professional_id
      ? supabase.from("professionals").select("full_name").eq("id", entry.professional_id).single()
      : Promise.resolve({ data: null }),
  ]);

  if (!patient?.email) return { error: "Este paciente no tiene correo registrado." };

  const clinicName = clinic?.commercial_name ?? "tu consultorio";
  const firstName = patient.full_name?.split(" ")[0] ?? "";
  const details = [service?.name, professional?.full_name ? `con ${professional.full_name}` : null].filter(Boolean).join(" ");

  const result = await sendEmail({
    to: patient.email,
    subject: `Hay un cupo disponible en ${clinicName}`,
    html: `<div style="font-family:-apple-system,sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#1f2937;">
      <p style="font-size:11px;color:#6b7280;text-transform:uppercase;letter-spacing:.06em;margin:0 0 16px;">${clinicName}</p>
      <h2 style="margin:0 0 12px;">${firstName ? `Hola, ${firstName}` : "Hola"}</h2>
      <p>Se liberó un cupo${details ? ` para ${details}` : ""} y quedaste anotado en la lista de espera. Escríbenos para agendarlo antes de que alguien más lo tome.</p>
      <p style="margin-top:32px;font-size:12px;color:#9ca3af;">Este mensaje fue enviado por Mi Consultorio Pro en nombre de ${clinicName}.</p>
    </div>`,
  });
  if (!result.ok) return { error: "No pudimos enviar el correo." };

  await supabase.from("waitlist_entries").update({ status: "notified", notified_at: new Date().toISOString() }).eq("id", id);
  revalidatePath("/dashboard/lista-espera");
  return {};
}

export async function bookWaitlistEntry(
  id: string,
  professionalId: string,
  serviceId: string,
  date: string,
  time: string,
): Promise<{ error?: string }> {
  const { clinicId, profileId, supabase } = await staffClinicId();

  const { data: entry } = await supabase.from("waitlist_entries").select("patient_id").eq("id", id).single();
  if (!entry) return { error: "No encontramos este registro." };

  const { data: service } = await supabase
    .from("services")
    .select("duration_minutes, price, deposit_amount")
    .eq("id", serviceId)
    .single();
  if (!service) return { error: "Selecciona un servicio." };
  if (!professionalId) return { error: "Selecciona un profesional." };

  const startsAt = new Date(`${date}T${time}:00`);
  const endsAt = new Date(startsAt.getTime() + service.duration_minutes * 60000);

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

  const { data: appointment, error } = await supabase
    .from("appointments")
    .insert({
      clinic_id: clinicId,
      patient_id: entry.patient_id,
      professional_id: professionalId,
      service_id: serviceId,
      starts_at: startsAt.toISOString(),
      ends_at: endsAt.toISOString(),
      modality: "in_person",
      status: "confirmed",
      price: service.price,
      deposit_required: service.deposit_amount ?? 0,
      created_by: profileId,
    })
    .select("id")
    .single();
  if (error || !appointment) return { error: "No pudimos crear la cita." };

  await notifyAppointment(createAdminClient(), appointment.id, "appointment_confirmation");
  await supabase.from("waitlist_entries").update({ status: "booked" }).eq("id", id);

  revalidatePath("/dashboard/lista-espera");
  revalidatePath("/dashboard/agenda");
  return {};
}

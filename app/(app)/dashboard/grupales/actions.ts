"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/session";

export type GroupSessionActionState = { error?: string; success?: boolean };

const STAFF_ROLES = ["clinic_owner", "assistant", "receptionist", "professional"] as const;

async function staffClinicId() {
  const profile = await requireRole([...STAFF_ROLES]);
  const supabase = await createClient();
  return { clinicId: profile.clinicId!, supabase };
}

export async function createGroupSession(
  _prev: GroupSessionActionState | undefined,
  formData: FormData,
): Promise<GroupSessionActionState> {
  const { clinicId, supabase } = await staffClinicId();

  const name = (formData.get("name") as string)?.trim();
  const startsAt = formData.get("starts_at") as string;
  const endsAt = formData.get("ends_at") as string;
  if (!name) return { error: "El nombre del taller es obligatorio." };
  if (!startsAt || !endsAt) return { error: "Indica fecha y hora de inicio y fin." };
  if (new Date(endsAt) <= new Date(startsAt)) return { error: "La hora de fin debe ser posterior al inicio." };

  const { error } = await supabase.from("group_sessions").insert({
    clinic_id: clinicId,
    name,
    description: (formData.get("description") as string) || null,
    professional_id: (formData.get("professional_id") as string) || null,
    service_id: (formData.get("service_id") as string) || null,
    location_id: (formData.get("location_id") as string) || null,
    starts_at: startsAt,
    ends_at: endsAt,
    modality: ((formData.get("modality") as string) || "in_person") as "in_person" | "virtual",
    virtual_link: (formData.get("virtual_link") as string) || null,
    max_capacity: Number(formData.get("max_capacity")) || 10,
  });

  if (error) return { error: "No pudimos crear el taller." };

  revalidatePath("/dashboard/grupales");
  return { success: true };
}

export async function updateGroupSessionStatus(
  id: string,
  status: "scheduled" | "completed" | "cancelled",
): Promise<void> {
  const { supabase } = await staffClinicId();
  await supabase.from("group_sessions").update({ status }).eq("id", id);
  revalidatePath("/dashboard/grupales");
  revalidatePath(`/dashboard/grupales/${id}`);
}

export async function addAttendee(
  groupSessionId: string,
  _prev: GroupSessionActionState | undefined,
  formData: FormData,
): Promise<GroupSessionActionState> {
  const { clinicId, supabase } = await staffClinicId();
  const patientId = formData.get("patient_id") as string;
  if (!patientId) return { error: "Selecciona un paciente." };

  const { error } = await supabase.from("group_session_attendees").insert({
    clinic_id: clinicId,
    group_session_id: groupSessionId,
    patient_id: patientId,
  });

  if (error) {
    if (error.code === "23505") return { error: "Ese paciente ya está inscrito." };
    return { error: error.message.includes("cupo") ? "El taller ya alcanzó su cupo máximo." : "No pudimos inscribir al paciente." };
  }

  revalidatePath(`/dashboard/grupales/${groupSessionId}`);
  return { success: true };
}

export async function updateAttendee(
  groupSessionId: string,
  attendeeId: string,
  fields: { attended?: boolean; payment_status?: "pending" | "paid" | "waived" },
): Promise<void> {
  const { supabase } = await staffClinicId();
  await supabase.from("group_session_attendees").update(fields).eq("id", attendeeId);
  revalidatePath(`/dashboard/grupales/${groupSessionId}`);
}

export async function removeAttendee(groupSessionId: string, attendeeId: string): Promise<void> {
  const { supabase } = await staffClinicId();
  await supabase.from("group_session_attendees").delete().eq("id", attendeeId);
  revalidatePath(`/dashboard/grupales/${groupSessionId}`);
}

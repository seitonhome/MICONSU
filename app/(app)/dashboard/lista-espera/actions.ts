"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/session";

export type WaitlistActionState = { error?: string; success?: boolean };

const STAFF_ROLES = ["clinic_owner", "assistant", "receptionist", "professional"] as const;

async function staffClinicId() {
  const profile = await requireRole([...STAFF_ROLES]);
  const supabase = await createClient();
  return { clinicId: profile.clinicId!, supabase };
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

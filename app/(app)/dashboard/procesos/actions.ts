"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/session";

export type ProcessActionState = { error?: string; success?: boolean };

async function clinicalClinicId() {
  const profile = await requireRole(["clinic_owner", "professional"]);
  const supabase = await createClient();
  return { clinicId: profile.clinicId!, supabase };
}

export async function createProcess(
  _prev: ProcessActionState | undefined,
  formData: FormData,
): Promise<ProcessActionState> {
  const { clinicId, supabase } = await clinicalClinicId();

  const patientId = formData.get("patient_id") as string;
  const professionalId = formData.get("professional_id") as string;
  if (!patientId) return { error: "Selecciona un paciente." };
  if (!professionalId) return { error: "Selecciona un profesional." };

  const { error } = await supabase.from("therapeutic_processes").insert({
    clinic_id: clinicId,
    patient_id: patientId,
    professional_id: professionalId,
    objective: (formData.get("objective") as string) || null,
    sessions_planned: formData.get("sessions_planned") ? Number(formData.get("sessions_planned")) : null,
    next_session_at: (formData.get("next_session_at") as string) || null,
    tasks_recommendations: (formData.get("tasks_recommendations") as string) || null,
  });

  if (error) return { error: "No pudimos crear el proceso." };

  revalidatePath("/dashboard/procesos");
  return { success: true };
}

export async function addProgressNote(id: string, note: string, nextSessionAt: string | null): Promise<void> {
  const { supabase } = await clinicalClinicId();

  const { data: process } = await supabase
    .from("therapeutic_processes")
    .select("progress_notes")
    .eq("id", id)
    .single();

  const timestamp = new Date().toLocaleString("es-CO");
  const entry = `[${timestamp}] ${note}`;
  const updated = process?.progress_notes ? `${process.progress_notes}\n\n${entry}` : entry;

  await supabase
    .from("therapeutic_processes")
    .update({
      progress_notes: updated,
      ...(nextSessionAt ? { next_session_at: nextSessionAt } : {}),
    })
    .eq("id", id);

  revalidatePath("/dashboard/procesos");
}

export async function updateProcessStatus(
  id: string,
  status: "active" | "paused" | "completed" | "abandoned" | "cancelled",
): Promise<void> {
  const { supabase } = await clinicalClinicId();
  await supabase.from("therapeutic_processes").update({ status }).eq("id", id);
  revalidatePath("/dashboard/procesos");
}

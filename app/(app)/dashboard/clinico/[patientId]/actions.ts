"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/session";

export type ClinicalActionState = { error?: string; success?: boolean };

async function clinicalContext() {
  const profile = await requireRole(["clinic_owner", "professional"]);
  const supabase = await createClient();
  let professionalId: string | null = null;
  if (profile.role === "professional") {
    const { data: prof } = await supabase.from("professionals").select("id").eq("profile_id", profile.id).single();
    professionalId = prof?.id ?? null;
  }
  return { clinicId: profile.clinicId!, supabase, profile, ownProfessionalId: professionalId };
}

export async function createClinicalNote(
  patientId: string,
  _prev: ClinicalActionState | undefined,
  formData: FormData,
): Promise<ClinicalActionState> {
  const { clinicId, supabase, profile, ownProfessionalId } = await clinicalContext();

  const professionalId = profile.role === "professional" ? ownProfessionalId : (formData.get("professional_id") as string);
  if (!professionalId) return { error: "Selecciona el profesional tratante." };

  const { data: note, error } = await supabase
    .from("clinical_notes")
    .insert({
      clinic_id: clinicId,
      patient_id: patientId,
      professional_id: professionalId,
      chief_complaint: (formData.get("chief_complaint") as string) || null,
      evolution_notes: (formData.get("evolution_notes") as string) || null,
      diagnosis: (formData.get("diagnosis") as string) || null,
      recommendations: (formData.get("recommendations") as string) || null,
      follow_up_plan: (formData.get("follow_up_plan") as string) || null,
      created_by: profile.id,
    })
    .select("id")
    .single();

  if (error || !note) return { error: "No pudimos guardar la nota clínica." };

  await supabase.from("clinical_notes_access_logs").insert({
    clinic_id: clinicId,
    clinical_note_id: note.id,
    accessed_by: profile.id,
    action: "edit",
  });

  revalidatePath(`/dashboard/clinico/${patientId}`);
  return { success: true };
}

export async function createTreatmentPlan(
  patientId: string,
  _prev: ClinicalActionState | undefined,
  formData: FormData,
): Promise<ClinicalActionState> {
  const { clinicId, supabase, profile, ownProfessionalId } = await clinicalContext();

  const professionalId = profile.role === "professional" ? ownProfessionalId : (formData.get("professional_id") as string);
  if (!professionalId) return { error: "Selecciona el profesional tratante." };

  const title = (formData.get("title") as string)?.trim();
  if (!title) return { error: "El título del plan es obligatorio." };

  const proceduresText = (formData.get("procedures") as string) || "";
  const procedures = proceduresText
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((description) => ({ description }));

  const { error } = await supabase.from("treatment_plans").insert({
    clinic_id: clinicId,
    patient_id: patientId,
    professional_id: professionalId,
    title,
    procedures,
    teeth_involved: (formData.get("teeth_involved") as string) || null,
    total_amount: Number(formData.get("total_amount")) || 0,
    paid_amount: Number(formData.get("paid_amount")) || 0,
    next_appointment_suggestion: (formData.get("next_appointment_suggestion") as string) || null,
    created_by: profile.id,
  });

  if (error) return { error: "No pudimos guardar el plan de tratamiento." };

  revalidatePath(`/dashboard/clinico/${patientId}`);
  return { success: true };
}

export async function registerPlanPayment(patientId: string, planId: string, amount: number): Promise<void> {
  const { supabase } = await clinicalContext();
  const { data: plan } = await supabase.from("treatment_plans").select("paid_amount").eq("id", planId).single();
  if (!plan) return;

  await supabase
    .from("treatment_plans")
    .update({ paid_amount: Number(plan.paid_amount) + amount })
    .eq("id", planId);

  revalidatePath(`/dashboard/clinico/${patientId}`);
}

export async function updateTreatmentPlanStatus(
  patientId: string,
  planId: string,
  status: "active" | "completed" | "cancelled",
): Promise<void> {
  const { supabase } = await clinicalContext();
  await supabase.from("treatment_plans").update({ status }).eq("id", planId);
  revalidatePath(`/dashboard/clinico/${patientId}`);
}

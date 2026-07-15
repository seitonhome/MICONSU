"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/session";

export type FollowupActionState = { error?: string; success?: boolean };

const STAFF_ROLES = ["clinic_owner", "assistant", "receptionist", "professional"] as const;

async function staffClinicId() {
  const profile = await requireRole([...STAFF_ROLES]);
  const supabase = await createClient();
  return { clinicId: profile.clinicId!, supabase };
}

export async function createFollowup(
  _prev: FollowupActionState | undefined,
  formData: FormData,
): Promise<FollowupActionState> {
  const { clinicId, supabase } = await staffClinicId();
  const patientId = formData.get("patient_id") as string;
  if (!patientId) return { error: "Selecciona un paciente." };

  const { error } = await supabase.from("post_consultation_followups").insert({
    clinic_id: clinicId,
    patient_id: patientId,
    followup_type: ((formData.get("followup_type") as string) || "thank_you") as
      | "thank_you"
      | "satisfaction_survey"
      | "review_request"
      | "package_renewal"
      | "custom",
    scheduled_for: (formData.get("scheduled_for") as string) || new Date().toISOString(),
    message: (formData.get("message") as string) || null,
  });

  if (error) return { error: "No pudimos crear el seguimiento." };

  revalidatePath("/dashboard/seguimientos");
  return { success: true };
}

export async function updateFollowupStatus(
  id: string,
  status: "pending" | "sent" | "completed" | "skipped",
): Promise<void> {
  const { supabase } = await staffClinicId();
  await supabase
    .from("post_consultation_followups")
    .update({ status, ...(status === "sent" ? { sent_at: new Date().toISOString() } : {}) })
    .eq("id", id);
  revalidatePath("/dashboard/seguimientos");
}

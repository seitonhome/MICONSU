"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/session";

export type ReviewActionState = { error?: string; success?: boolean };

const STAFF_ROLES = ["clinic_owner", "assistant", "receptionist"] as const;

async function staffClinicId() {
  const profile = await requireRole([...STAFF_ROLES]);
  const supabase = await createClient();
  return { clinicId: profile.clinicId!, supabase };
}

export async function createReview(
  _prev: ReviewActionState | undefined,
  formData: FormData,
): Promise<ReviewActionState> {
  const { clinicId, supabase } = await staffClinicId();
  const rating = Number(formData.get("rating"));
  if (!rating || rating < 1 || rating > 5) return { error: "La calificación debe estar entre 1 y 5." };

  const { error } = await supabase.from("reviews").insert({
    clinic_id: clinicId,
    patient_id: (formData.get("patient_id") as string) || null,
    professional_id: (formData.get("professional_id") as string) || null,
    service_id: (formData.get("service_id") as string) || null,
    rating,
    comment: (formData.get("comment") as string) || null,
  });

  if (error) return { error: "No pudimos registrar la reseña." };

  revalidatePath("/dashboard/resenas");
  return { success: true };
}

export async function updateReviewStatus(id: string, status: "private" | "approved" | "featured"): Promise<void> {
  const { supabase } = await staffClinicId();
  await supabase.from("reviews").update({ status }).eq("id", id);
  revalidatePath("/dashboard/resenas");
}

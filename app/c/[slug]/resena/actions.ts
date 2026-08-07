"use server";

import { createClient, createAdminClient } from "@/lib/supabase/server";
import { checkRateLimit, getClientIp } from "@/lib/security/rate-limit";

export type ReviewSubmitState = { error?: string; success?: boolean };

export async function submitPublicReview(
  clinicSlug: string,
  _prev: ReviewSubmitState | undefined,
  formData: FormData,
): Promise<ReviewSubmitState> {
  const ip = await getClientIp();
  const rateLimitOk = await checkRateLimit(`review:ip:${ip}`, { max: 5, windowSeconds: 3600 });
  if (!rateLimitOk) return { error: "Demasiados intentos. Espera unos minutos antes de volver a intentar." };

  const rating = Number(formData.get("rating"));
  if (!rating || rating < 1 || rating > 5) return { error: "Selecciona una calificación de 1 a 5 estrellas." };

  const patientId = (formData.get("patient_id") as string) || null;
  const professionalId = (formData.get("professional_id") as string) || null;

  // Página pública, sin sesión: se valida y se inserta con el cliente admin,
  // igual que consent_records/intake_form_responses en el flujo de reserva.
  const supabase = await createClient();
  const { data: clinic } = await supabase
    .from("clinics")
    .select("id")
    .eq("slug", clinicSlug)
    .eq("is_published", true)
    .is("deleted_at", null)
    .single();

  if (!clinic) return { error: "No pudimos encontrar este consultorio." };

  const admin = createAdminClient();

  let validPatientId: string | null = null;
  if (patientId) {
    const { data: patient } = await admin
      .from("patients")
      .select("id")
      .eq("id", patientId)
      .eq("clinic_id", clinic.id)
      .maybeSingle();
    validPatientId = patient?.id ?? null;
  }

  let validProfessionalId: string | null = null;
  if (professionalId) {
    const { data: professional } = await admin
      .from("professionals")
      .select("id")
      .eq("id", professionalId)
      .eq("clinic_id", clinic.id)
      .maybeSingle();
    validProfessionalId = professional?.id ?? null;
  }

  const { error } = await admin.from("reviews").insert({
    clinic_id: clinic.id,
    patient_id: validPatientId,
    professional_id: validProfessionalId,
    rating,
    comment: (formData.get("comment") as string) || null,
    status: "private",
  });

  if (error) return { error: "No pudimos guardar tu reseña. Intenta de nuevo." };

  return { success: true };
}

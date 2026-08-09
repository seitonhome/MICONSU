"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/session";
import { disclaimerTypeForClassification, CONSENT_TEMPLATES } from "@/lib/templates/consent-templates";
import type { Database } from "@/lib/supabase/types";

export type ServiceActionState = { error?: string; success?: boolean; warning?: string };

async function ownerClinicId() {
  const profile = await requireRole(["clinic_owner"]);
  const supabase = await createClient();
  return { clinicId: profile.clinicId!, supabase };
}

/**
 * La sugerencia de consentimiento por clasificación (terapia alternativa,
 * bienestar, etc.) solo se aplicaba una vez, durante el onboarding — un
 * servicio con esa clasificación creado o cambiado después desde este
 * dashboard nunca avisaba que falta el documento correspondiente. Devuelve
 * un aviso no bloqueante (el servicio se guarda igual) si el consultorio
 * todavía no tiene ese consentimiento activo.
 */
async function suggestedConsentWarning(
  supabase: Awaited<ReturnType<typeof createClient>>,
  clinicId: string,
  classification: Database["public"]["Enums"]["service_classification"],
): Promise<string | undefined> {
  const documentType = disclaimerTypeForClassification(classification);
  if (!documentType) return undefined;

  const { count } = await supabase
    .from("consent_documents")
    .select("id", { count: "exact", head: true })
    .eq("clinic_id", clinicId)
    .eq("document_type", documentType)
    .eq("is_active", true);

  if ((count ?? 0) > 0) return undefined;
  return `Este tipo de servicio suele necesitar el consentimiento "${CONSENT_TEMPLATES[documentType].title}", que tu consultorio todavía no tiene activo. Agrégalo en Consentimientos.`;
}

function parseServiceForm(formData: FormData) {
  const durationMinutes = Number(formData.get("duration_minutes"));
  const price = Number(formData.get("price")) || 0;
  const depositAmount = formData.get("deposit_amount") ? Number(formData.get("deposit_amount")) : null;
  const paymentType = formData.get("payment_type") as "none" | "deposit" | "full" | "manual" | "in_person";

  return {
    name: (formData.get("name") as string)?.trim(),
    description: (formData.get("description") as string) || null,
    category_id: (formData.get("category_id") as string) || null,
    classification: formData.get("classification") as Database["public"]["Enums"]["service_classification"],
    duration_minutes: durationMinutes > 0 ? durationMinutes : 30,
    price,
    price_visible: formData.get("price_visible") === "on",
    requires_payment: paymentType !== "none",
    payment_type: paymentType,
    deposit_amount: depositAmount,
    modality: formData.get("modality") as "in_person" | "virtual" | "both",
    color_hex: (formData.get("color_hex") as string) || "#0F4C4C",
    requires_additional_consent: formData.get("requires_additional_consent") === "on",
    min_advance_hours: Number(formData.get("min_advance_hours")) || 0,
    max_cancel_hours: Number(formData.get("max_cancel_hours")) || 0,
    pre_instructions: (formData.get("pre_instructions") as string) || null,
    post_message: (formData.get("post_message") as string) || null,
    disclaimer: (formData.get("disclaimer") as string) || null,
    allows_package: formData.get("allows_package") === "on",
  };
}

/**
 * Solo toca vínculos de los profesionales que el checklist realmente mostró
 * (candidateIds = profesionales activos al momento de abrir el diálogo). Un
 * profesional que se desactivó entre medias y no aparece en el formulario
 * conserva su vínculo intacto en vez de perderlo en el delete-and-reinsert.
 */
async function syncServiceProfessionals(
  supabase: Awaited<ReturnType<typeof createClient>>,
  clinicId: string,
  serviceId: string,
  professionalIds: string[],
  candidateIds: string[],
): Promise<{ error?: string }> {
  if (candidateIds.length === 0) return {};

  const { error: deleteError } = await supabase
    .from("professional_services")
    .delete()
    .eq("service_id", serviceId)
    .in("professional_id", candidateIds);
  if (deleteError) return { error: "No pudimos actualizar los profesionales asignados a este servicio." };

  if (professionalIds.length > 0) {
    const { error: insertError } = await supabase.from("professional_services").insert(
      professionalIds.map((professionalId) => ({ clinic_id: clinicId, service_id: serviceId, professional_id: professionalId })),
    );
    if (insertError) return { error: "No pudimos actualizar los profesionales asignados a este servicio." };
  }

  return {};
}

export async function createService(
  _prev: ServiceActionState | undefined,
  formData: FormData,
): Promise<ServiceActionState> {
  const { clinicId, supabase } = await ownerClinicId();
  const fields = parseServiceForm(formData);
  const professionalIds = formData.getAll("professional_ids").map(String);
  const candidateIds = formData.getAll("professional_candidate_ids").map(String);

  if (!fields.name) return { error: "El nombre del servicio es obligatorio." };
  if (fields.payment_type === "deposit" && !fields.deposit_amount) {
    return { error: "Indica el monto del anticipo." };
  }

  const { data: service, error } = await supabase
    .from("services")
    .insert({ clinic_id: clinicId, ...fields })
    .select("id")
    .single();
  if (error || !service) return { error: "No pudimos crear el servicio." };

  // Best-effort: el servicio ya se creó, y reintentar "Crear servicio" aquí
  // duplicaría el registro — si falla el vínculo con profesionales, se puede
  // corregir editando el servicio ya creado (updateService sí reporta error).
  const syncResult = await syncServiceProfessionals(supabase, clinicId, service.id, professionalIds, candidateIds);
  if (syncResult.error) console.error("syncServiceProfessionals (create):", syncResult.error);

  const warning = await suggestedConsentWarning(supabase, clinicId, fields.classification);

  revalidatePath("/dashboard/servicios");
  return { success: true, warning };
}

export async function updateService(
  id: string,
  _prev: ServiceActionState | undefined,
  formData: FormData,
): Promise<ServiceActionState> {
  const { clinicId, supabase } = await ownerClinicId();
  const fields = parseServiceForm(formData);
  const professionalIds = formData.getAll("professional_ids").map(String);
  const candidateIds = formData.getAll("professional_candidate_ids").map(String);

  if (!fields.name) return { error: "El nombre del servicio es obligatorio." };
  if (fields.payment_type === "deposit" && !fields.deposit_amount) {
    return { error: "Indica el monto del anticipo." };
  }

  const { error } = await supabase.from("services").update(fields).eq("id", id);
  if (error) return { error: "No pudimos actualizar el servicio." };

  const syncResult = await syncServiceProfessionals(supabase, clinicId, id, professionalIds, candidateIds);
  if (syncResult.error) return { error: syncResult.error };

  const warning = await suggestedConsentWarning(supabase, clinicId, fields.classification);

  revalidatePath("/dashboard/servicios");
  return { success: true, warning };
}

export async function toggleServiceActive(id: string, isActive: boolean): Promise<void> {
  const { supabase } = await ownerClinicId();
  await supabase.from("services").update({ is_active: isActive }).eq("id", id);
  revalidatePath("/dashboard/servicios");
}

export async function deleteService(id: string): Promise<void> {
  const { supabase } = await ownerClinicId();
  await supabase.from("services").update({ deleted_at: new Date().toISOString() }).eq("id", id);
  revalidatePath("/dashboard/servicios");
}

export async function createCategory(
  _prev: ServiceActionState | undefined,
  formData: FormData,
): Promise<ServiceActionState> {
  const { clinicId, supabase } = await ownerClinicId();
  const name = (formData.get("name") as string)?.trim();
  if (!name) return { error: "El nombre de la categoría es obligatorio." };

  const { error } = await supabase.from("service_categories").insert({ clinic_id: clinicId, name });
  if (error) return { error: "No pudimos crear la categoría." };

  revalidatePath("/dashboard/servicios");
  return { success: true };
}

export async function deleteCategory(id: string): Promise<void> {
  const { supabase } = await ownerClinicId();
  await supabase.from("service_categories").update({ deleted_at: new Date().toISOString() }).eq("id", id);
  revalidatePath("/dashboard/servicios");
}

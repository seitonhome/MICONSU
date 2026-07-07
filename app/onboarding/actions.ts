"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/session";
import { slugify } from "@/lib/utils/slugify";
import { getServiceTemplates } from "@/lib/templates/service-templates";
import { CONSENT_TEMPLATES } from "@/lib/templates/consent-templates";
import { encryptCredentials } from "@/lib/payments/crypto";
import type { PractitionerType } from "@/lib/auth/roles";
import type { Database } from "@/lib/supabase/types";

export type OnboardingActionState = { error?: string; success?: boolean };

async function ownerClinicId(): Promise<{ clinicId: string; supabase: Awaited<ReturnType<typeof createClient>> }> {
  const profile = await requireRole(["clinic_owner"]);
  const supabase = await createClient();
  return { clinicId: profile.clinicId!, supabase };
}

function revalidateOnboarding() {
  revalidatePath("/onboarding", "layout");
}

// ── Paso 1: datos del consultorio ──────────────────────────────────────────

export async function updateClinicDetails(
  _prev: OnboardingActionState | undefined,
  formData: FormData,
): Promise<OnboardingActionState> {
  const { clinicId, supabase } = await ownerClinicId();

  const { error } = await supabase
    .from("clinics")
    .update({
      legal_name: (formData.get("legal_name") as string) || null,
      description: (formData.get("description") as string) || null,
      contact_email: (formData.get("contact_email") as string) || null,
      contact_phone: (formData.get("contact_phone") as string) || null,
      whatsapp_number: (formData.get("whatsapp_number") as string) || null,
      website_url: (formData.get("website_url") as string) || null,
    })
    .eq("id", clinicId);

  if (error) return { error: "No pudimos guardar los datos. Intenta de nuevo." };

  redirect("/onboarding/2");
}

// ── Paso 2: logo y colores ──────────────────────────────────────────────────

export async function updateBranding(
  _prev: OnboardingActionState | undefined,
  formData: FormData,
): Promise<OnboardingActionState> {
  const { clinicId, supabase } = await ownerClinicId();

  const logoFile = formData.get("logo") as File | null;
  const primaryColor = formData.get("primary_color") as string;
  const secondaryColor = formData.get("secondary_color") as string;
  const visualTheme = formData.get("visual_theme") as Database["public"]["Enums"]["visual_theme"];

  let logoUrl: string | undefined;

  if (logoFile && logoFile.size > 0) {
    const ext = logoFile.name.split(".").pop() || "png";
    const path = `${clinicId}/logo-${Date.now()}.${ext}`;
    const { error: uploadError } = await supabase.storage.from("branding").upload(path, logoFile, {
      upsert: true,
      contentType: logoFile.type || undefined,
    });
    if (uploadError) return { error: "No pudimos subir el logo. Intenta con otra imagen." };
    logoUrl = supabase.storage.from("branding").getPublicUrl(path).data.publicUrl;
  }

  const { error } = await supabase
    .from("clinic_branding")
    .update({
      primary_color: primaryColor,
      secondary_color: secondaryColor,
      visual_theme: visualTheme,
      ...(logoUrl ? { logo_url: logoUrl } : {}),
    })
    .eq("clinic_id", clinicId);

  if (error) return { error: "No pudimos guardar tu marca. Intenta de nuevo." };

  redirect("/onboarding/3");
}

// ── Paso 3: tipo de práctica ────────────────────────────────────────────────

export async function updatePractitionerType(
  _prev: OnboardingActionState | undefined,
  formData: FormData,
): Promise<OnboardingActionState> {
  const { clinicId, supabase } = await ownerClinicId();
  const practitionerType = formData.get("practitioner_type") as PractitionerType;

  const { error } = await supabase
    .from("clinics")
    .update({ primary_practitioner_type: practitionerType })
    .eq("id", clinicId);

  if (error) return { error: "No pudimos guardar el tipo de práctica." };

  redirect("/onboarding/4");
}

// ── Paso 4: profesionales ───────────────────────────────────────────────────

export async function addProfessional(
  _prev: OnboardingActionState | undefined,
  formData: FormData,
): Promise<OnboardingActionState> {
  const { clinicId, supabase } = await ownerClinicId();
  const fullName = (formData.get("full_name") as string)?.trim();
  const specialtyLabel = (formData.get("specialty_label") as string) || null;
  const practitionerType = formData.get("practitioner_type") as PractitionerType;
  const linkOwnerProfile = formData.get("link_owner_profile") === "on";

  if (!fullName) return { error: "El nombre del profesional es obligatorio." };

  const baseSlug = slugify(fullName) || "profesional";
  let slug = baseSlug;
  let profileId: string | null = null;

  if (linkOwnerProfile) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    profileId = user?.id ?? null;
  }

  for (let attempt = 0; attempt <= 5; attempt += 1) {
    const { error } = await supabase.from("professionals").insert({
      clinic_id: clinicId,
      profile_id: profileId,
      slug,
      full_name: fullName,
      specialty_label: specialtyLabel,
      practitioner_type: practitionerType,
    });

    if (!error) break;
    if (attempt === 5) return { error: "No pudimos agregar el profesional." };
    slug = `${baseSlug}-${attempt + 1}`;
  }

  revalidateOnboarding();
  return { success: true };
}

export async function deleteProfessional(id: string): Promise<void> {
  const { supabase } = await ownerClinicId();
  await supabase.from("professionals").delete().eq("id", id);
  revalidateOnboarding();
}

// ── Paso 5: sedes o modalidad virtual ───────────────────────────────────────

export async function addLocation(
  _prev: OnboardingActionState | undefined,
  formData: FormData,
): Promise<OnboardingActionState> {
  const { clinicId, supabase } = await ownerClinicId();
  const name = (formData.get("name") as string)?.trim();
  const isVirtual = formData.get("is_virtual") === "on";

  if (!name) return { error: "El nombre de la sede es obligatorio." };

  const { error } = await supabase.from("clinic_locations").insert({
    clinic_id: clinicId,
    name,
    address: (formData.get("address") as string) || null,
    city: (formData.get("city") as string) || null,
    is_virtual: isVirtual,
  });

  if (error) return { error: "No pudimos agregar la sede." };

  revalidateOnboarding();
  return { success: true };
}

export async function deleteLocation(id: string): Promise<void> {
  const { supabase } = await ownerClinicId();
  await supabase.from("clinic_locations").delete().eq("id", id);
  revalidateOnboarding();
}

// ── Paso 6: servicios ────────────────────────────────────────────────────────

export async function applyServiceTemplates(
  _prev: OnboardingActionState | undefined,
  _formData: FormData,
): Promise<OnboardingActionState> {
  const { clinicId, supabase } = await ownerClinicId();

  const { data: clinic } = await supabase
    .from("clinics")
    .select("primary_practitioner_type")
    .eq("id", clinicId)
    .single();

  const templates = getServiceTemplates(
    (clinic?.primary_practitioner_type as PractitionerType) ?? "otro",
  );

  const { data: existing } = await supabase.from("services").select("name").eq("clinic_id", clinicId);
  const existingNames = new Set((existing ?? []).map((s) => s.name));
  const toInsert = templates.filter((t) => !existingNames.has(t.name));

  if (toInsert.length > 0) {
    const { error } = await supabase.from("services").insert(
      toInsert.map((t) => ({
        clinic_id: clinicId,
        name: t.name,
        duration_minutes: t.durationMinutes,
        classification: t.classification,
        price: 0,
        price_visible: false,
      })),
    );
    if (error) return { error: "No pudimos crear los servicios sugeridos." };
  }

  revalidateOnboarding();
  return { success: true };
}

export async function addServiceManual(
  _prev: OnboardingActionState | undefined,
  formData: FormData,
): Promise<OnboardingActionState> {
  const { clinicId, supabase } = await ownerClinicId();
  const name = (formData.get("name") as string)?.trim();
  const duration = Number(formData.get("duration_minutes"));
  const price = Number(formData.get("price")) || 0;
  const classification = formData.get(
    "classification",
  ) as Database["public"]["Enums"]["service_classification"];
  const modality = formData.get("modality") as "in_person" | "virtual" | "both";

  if (!name) return { error: "El nombre del servicio es obligatorio." };

  const { error } = await supabase.from("services").insert({
    clinic_id: clinicId,
    name,
    duration_minutes: duration > 0 ? duration : 30,
    price,
    price_visible: price > 0,
    classification,
    modality,
  });

  if (error) return { error: "No pudimos agregar el servicio." };

  revalidateOnboarding();
  return { success: true };
}

export async function deleteService(id: string): Promise<void> {
  const { supabase } = await ownerClinicId();
  await supabase.from("services").delete().eq("id", id);
  revalidateOnboarding();
}

// ── Paso 7: horarios ─────────────────────────────────────────────────────────

export async function addAvailabilityRule(
  _prev: OnboardingActionState | undefined,
  formData: FormData,
): Promise<OnboardingActionState> {
  const { clinicId, supabase } = await ownerClinicId();
  const professionalId = formData.get("professional_id") as string;
  const startTime = formData.get("start_time") as string;
  const endTime = formData.get("end_time") as string;
  const days = formData.getAll("days").map((d) => Number(d));

  if (!professionalId || days.length === 0 || !startTime || !endTime) {
    return { error: "Selecciona al menos un día y un horario válido." };
  }

  const { error } = await supabase.from("availability_rules").insert(
    days.map((day) => ({
      clinic_id: clinicId,
      professional_id: professionalId,
      day_of_week: day,
      start_time: startTime,
      end_time: endTime,
    })),
  );

  if (error) return { error: "No pudimos guardar el horario. Verifica que la hora de fin sea mayor a la de inicio." };

  revalidateOnboarding();
  return { success: true };
}

export async function deleteAvailabilityRule(id: string): Promise<void> {
  const { supabase } = await ownerClinicId();
  await supabase.from("availability_rules").delete().eq("id", id);
  revalidateOnboarding();
}

// ── Paso 8: pagos ─────────────────────────────────────────────────────────────

export async function configureManualTransfer(
  _prev: OnboardingActionState | undefined,
  formData: FormData,
): Promise<OnboardingActionState> {
  const { clinicId, supabase } = await ownerClinicId();
  const instructions = (formData.get("instructions") as string)?.trim();

  if (!instructions) return { error: "Escribe las instrucciones para transferencia." };

  const { data: provider, error } = await supabase
    .from("payment_providers")
    .upsert(
      {
        clinic_id: clinicId,
        provider_key: "manual_transfer",
        display_name: "Transferencia bancaria",
        is_active: true,
        is_sandbox: false,
      },
      { onConflict: "clinic_id,provider_key" },
    )
    .select()
    .single();

  if (error || !provider) return { error: "No pudimos activar la transferencia manual." };

  const { data: existingMethod } = await supabase
    .from("payment_methods")
    .select("id")
    .eq("payment_provider_id", provider.id)
    .maybeSingle();

  if (existingMethod) {
    await supabase
      .from("payment_methods")
      .update({ instructions, is_active: true })
      .eq("id", existingMethod.id);
  } else {
    await supabase.from("payment_methods").insert({
      clinic_id: clinicId,
      payment_provider_id: provider.id,
      label: "Transferencia bancaria",
      instructions,
      is_active: true,
    });
  }

  revalidateOnboarding();
  return { success: true };
}

export async function configureWompi(
  _prev: OnboardingActionState | undefined,
  formData: FormData,
): Promise<OnboardingActionState> {
  const { clinicId, supabase } = await ownerClinicId();
  const publicKey = (formData.get("public_key") as string)?.trim();
  const privateKey = (formData.get("private_key") as string)?.trim();
  const eventsSecret = (formData.get("events_secret") as string)?.trim();
  const integritySecret = (formData.get("integrity_secret") as string)?.trim();
  const isSandbox = formData.get("is_sandbox") === "on";

  if (!publicKey || !privateKey) {
    return { error: "La llave pública y privada de Wompi son obligatorias." };
  }

  const encrypted = encryptCredentials({
    publicKey,
    privateKey,
    eventsSecret: eventsSecret ?? "",
    integritySecret: integritySecret ?? "",
  });

  const { error } = await supabase.from("payment_providers").upsert(
    {
      clinic_id: clinicId,
      provider_key: "wompi",
      display_name: "Wompi",
      is_active: true,
      is_sandbox: isSandbox,
      encrypted_credentials: encrypted,
    },
    { onConflict: "clinic_id,provider_key" },
  );

  if (error) return { error: "No pudimos guardar la configuración de Wompi." };

  revalidateOnboarding();
  return { success: true };
}

// ── Paso 9: consentimientos ────────────────────────────────────────────────

export async function activateConsents(
  _prev: OnboardingActionState | undefined,
  formData: FormData,
): Promise<OnboardingActionState> {
  const { clinicId, supabase } = await ownerClinicId();
  const selected = formData
    .getAll("document_type")
    .map((v) => v as Database["public"]["Enums"]["consent_document_type"]);

  if (selected.length === 0) return { error: "Selecciona al menos un documento." };

  const { data: existing } = await supabase
    .from("consent_documents")
    .select("document_type")
    .eq("clinic_id", clinicId);
  const existingTypes = new Set((existing ?? []).map((d) => d.document_type));
  const toInsert = selected.filter((t) => !existingTypes.has(t));

  if (toInsert.length > 0) {
    const { error } = await supabase.from("consent_documents").insert(
      toInsert.map((type) => ({
        clinic_id: clinicId,
        document_type: type,
        title: CONSENT_TEMPLATES[type].title,
        body: CONSENT_TEMPLATES[type].body,
      })),
    );
    if (error) return { error: "No pudimos activar los documentos seleccionados." };
  }

  revalidateOnboarding();
  return { success: true };
}

// ── Paso 12: publicación ────────────────────────────────────────────────────

export async function publishClinic(_formData: FormData): Promise<void> {
  const { clinicId, supabase } = await ownerClinicId();
  await supabase.from("clinics").update({ is_published: true }).eq("id", clinicId);
  redirect("/dashboard?welcome=1");
}

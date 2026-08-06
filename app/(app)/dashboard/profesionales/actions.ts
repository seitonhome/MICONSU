"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/session";
import { slugify } from "@/lib/utils/slugify";
import { getClinicEntitlements } from "@/lib/modules";
import type { PractitionerType } from "@/lib/auth/roles";

export type ProfessionalActionState = { error?: string; success?: boolean };

async function ownerClinicId() {
  const profile = await requireRole(["clinic_owner"]);
  const supabase = await createClient();
  return { clinicId: profile.clinicId!, supabase };
}

function parseProfessionalForm(formData: FormData) {
  return {
    full_name: (formData.get("full_name") as string)?.trim(),
    practitioner_type: formData.get("practitioner_type") as PractitionerType,
    specialty_label: (formData.get("specialty_label") as string) || null,
    license_number: (formData.get("license_number") as string) || null,
    bio: (formData.get("bio") as string) || null,
    accepts_in_person: formData.get("accepts_in_person") === "on",
    accepts_virtual: formData.get("accepts_virtual") === "on",
  };
}

export async function createProfessional(
  _prev: ProfessionalActionState | undefined,
  formData: FormData,
): Promise<ProfessionalActionState> {
  const { clinicId, supabase } = await ownerClinicId();
  const fields = parseProfessionalForm(formData);

  if (!fields.full_name) return { error: "El nombre completo es obligatorio." };

  const entitlements = await getClinicEntitlements(clinicId);
  const { count: currentProfessionals } = await supabase
    .from("professionals")
    .select("id", { count: "exact", head: true })
    .eq("clinic_id", clinicId)
    .is("deleted_at", null);

  if ((currentProfessionals ?? 0) >= entitlements.professionalsAllowed) {
    return {
      error: `Tu plan permite hasta ${entitlements.professionalsAllowed} profesional(es). Contacta a soporte para agregar más.`,
    };
  }

  const baseSlug = slugify(fields.full_name) || "profesional";
  let slug = baseSlug;

  for (let attempt = 0; attempt <= 5; attempt += 1) {
    const { error } = await supabase.from("professionals").insert({
      clinic_id: clinicId,
      slug,
      ...fields,
    });

    if (!error) break;
    if (attempt === 5) return { error: "No pudimos agregar el profesional." };
    slug = `${baseSlug}-${attempt + 1}`;
  }

  revalidatePath("/dashboard/profesionales");
  return { success: true };
}

export async function updateProfessional(
  id: string,
  _prev: ProfessionalActionState | undefined,
  formData: FormData,
): Promise<ProfessionalActionState> {
  const { supabase } = await ownerClinicId();
  const fields = parseProfessionalForm(formData);
  const isActive = formData.get("is_active") === "on";

  if (!fields.full_name) return { error: "El nombre completo es obligatorio." };

  const { error } = await supabase
    .from("professionals")
    .update({ ...fields, is_active: isActive })
    .eq("id", id);

  if (error) return { error: "No pudimos actualizar el profesional." };

  revalidatePath("/dashboard/profesionales");
  return { success: true };
}

export async function deleteProfessional(id: string): Promise<void> {
  const { supabase } = await ownerClinicId();
  await supabase
    .from("professionals")
    .update({ deleted_at: new Date().toISOString(), is_active: false })
    .eq("id", id);
  revalidatePath("/dashboard/profesionales");
}

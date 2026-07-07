"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/session";
import type { Database } from "@/lib/supabase/types";

export type ServiceActionState = { error?: string; success?: boolean };

async function ownerClinicId() {
  const profile = await requireRole(["clinic_owner"]);
  const supabase = await createClient();
  return { clinicId: profile.clinicId!, supabase };
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

export async function createService(
  _prev: ServiceActionState | undefined,
  formData: FormData,
): Promise<ServiceActionState> {
  const { clinicId, supabase } = await ownerClinicId();
  const fields = parseServiceForm(formData);

  if (!fields.name) return { error: "El nombre del servicio es obligatorio." };

  const { error } = await supabase.from("services").insert({ clinic_id: clinicId, ...fields });
  if (error) return { error: "No pudimos crear el servicio." };

  revalidatePath("/dashboard/servicios");
  return { success: true };
}

export async function updateService(
  id: string,
  _prev: ServiceActionState | undefined,
  formData: FormData,
): Promise<ServiceActionState> {
  const { supabase } = await ownerClinicId();
  const fields = parseServiceForm(formData);

  if (!fields.name) return { error: "El nombre del servicio es obligatorio." };

  const { error } = await supabase.from("services").update(fields).eq("id", id);
  if (error) return { error: "No pudimos actualizar el servicio." };

  revalidatePath("/dashboard/servicios");
  return { success: true };
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

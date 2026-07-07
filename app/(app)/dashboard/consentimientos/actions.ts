"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/session";
import type { Database } from "@/lib/supabase/types";

export type ConsentActionState = { error?: string; success?: boolean };

async function ownerClinicId() {
  const profile = await requireRole(["clinic_owner"]);
  const supabase = await createClient();
  return { clinicId: profile.clinicId!, supabase };
}

export async function createConsentDocument(
  _prev: ConsentActionState | undefined,
  formData: FormData,
): Promise<ConsentActionState> {
  const { clinicId, supabase } = await ownerClinicId();
  const documentType = formData.get("document_type") as Database["public"]["Enums"]["consent_document_type"];
  const title = (formData.get("title") as string)?.trim();
  const body = (formData.get("body") as string)?.trim();
  const serviceId = (formData.get("service_id") as string) || null;

  if (!title || !body) return { error: "El título y el texto son obligatorios." };

  const { error } = await supabase.from("consent_documents").insert({
    clinic_id: clinicId,
    document_type: documentType,
    title,
    body,
    service_id: serviceId,
  });

  if (error) return { error: "No pudimos crear el documento." };

  revalidatePath("/dashboard/consentimientos");
  return { success: true };
}

export async function updateConsentDocument(
  id: string,
  _prev: ConsentActionState | undefined,
  formData: FormData,
): Promise<ConsentActionState> {
  const { supabase } = await ownerClinicId();
  const title = (formData.get("title") as string)?.trim();
  const body = (formData.get("body") as string)?.trim();

  if (!title || !body) return { error: "El título y el texto son obligatorios." };

  const { data: current } = await supabase.from("consent_documents").select("version").eq("id", id).single();

  const { error } = await supabase
    .from("consent_documents")
    .update({ title, body, version: (current?.version ?? 1) + 1 })
    .eq("id", id);

  if (error) return { error: "No pudimos actualizar el documento." };

  revalidatePath("/dashboard/consentimientos");
  return { success: true };
}

export async function toggleConsentActive(id: string, isActive: boolean): Promise<void> {
  const { supabase } = await ownerClinicId();
  await supabase.from("consent_documents").update({ is_active: isActive }).eq("id", id);
  revalidatePath("/dashboard/consentimientos");
}

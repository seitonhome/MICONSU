"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/session";

export type ResourceActionState = { error?: string; success?: boolean };

const LIBRARY_ROLES = ["clinic_owner", "assistant", "professional"] as const;
const ASSIGN_ROLES = ["clinic_owner", "assistant", "receptionist", "professional"] as const;

async function libraryClinicId() {
  const profile = await requireRole([...LIBRARY_ROLES]);
  const supabase = await createClient();
  return { clinicId: profile.clinicId!, supabase };
}

export async function uploadResource(
  _prev: ResourceActionState | undefined,
  formData: FormData,
): Promise<ResourceActionState> {
  const { clinicId, supabase } = await libraryClinicId();

  const title = (formData.get("title") as string)?.trim();
  const file = formData.get("file") as File | null;
  if (!title) return { error: "El título es obligatorio." };
  if (!file || file.size === 0) return { error: "Selecciona un archivo." };

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = `${clinicId}/resources/${Date.now()}-${file.name}`;
  const { error: uploadError } = await supabase.storage.from("clinical-documents").upload(path, file);
  if (uploadError) return { error: "No pudimos subir el archivo." };

  const { error } = await supabase.from("resource_library").insert({
    clinic_id: clinicId,
    title,
    description: (formData.get("description") as string) || null,
    resource_type: ((formData.get("resource_type") as string) || "pdf") as
      | "pdf"
      | "audio"
      | "video"
      | "guide"
      | "exercise"
      | "other",
    file_url: path,
    created_by: user?.id ?? null,
  });

  if (error) return { error: "No pudimos registrar el recurso." };

  revalidatePath("/dashboard/recursos");
  return { success: true };
}

export async function deactivateResource(id: string): Promise<void> {
  const { supabase } = await libraryClinicId();
  await supabase.from("resource_library").update({ deleted_at: new Date().toISOString() }).eq("id", id);
  revalidatePath("/dashboard/recursos");
}

export async function assignResource(
  resourceId: string,
  _prev: ResourceActionState | undefined,
  formData: FormData,
): Promise<ResourceActionState> {
  const profile = await requireRole([...ASSIGN_ROLES]);
  const supabase = await createClient();
  const patientId = formData.get("patient_id") as string;
  if (!patientId) return { error: "Selecciona un paciente." };

  const { error } = await supabase.from("assigned_resources").insert({
    clinic_id: profile.clinicId!,
    resource_id: resourceId,
    patient_id: patientId,
    assigned_by: profile.id,
  });

  if (error) return { error: "No pudimos asignar el recurso." };

  revalidatePath("/dashboard/recursos");
  return { success: true };
}

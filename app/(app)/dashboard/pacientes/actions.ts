"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/session";
import { logAudit } from "@/lib/security/audit";
import { MAX_PATIENT_DOCUMENT_BYTES, formatMaxSize } from "@/lib/storage/limits";

export type PatientActionState = { error?: string; success?: boolean };

const STAFF_ROLES = ["clinic_owner", "assistant", "receptionist"] as const;

async function staffClinicId() {
  const profile = await requireRole([...STAFF_ROLES]);
  const supabase = await createClient();
  return { clinicId: profile.clinicId!, profileId: profile.id, supabase };
}

// Los documentos administrativos sí los puede subir/borrar un profesional
// tratante (así lo permite la RLS de patient_documents) — separado de
// STAFF_ROLES porque el resto de acciones de esta ficha (editar/eliminar
// el paciente en sí) siguen siendo solo del equipo administrativo.
async function documentClinicId() {
  const profile = await requireRole([...STAFF_ROLES, "professional"]);
  const supabase = await createClient();
  return { clinicId: profile.clinicId!, profileId: profile.id, supabase };
}

function parsePatientForm(formData: FormData) {
  return {
    full_name: (formData.get("full_name") as string)?.trim(),
    document_type: (formData.get("document_type") as string) || null,
    document_number: (formData.get("document_number") as string) || null,
    email: (formData.get("email") as string) || null,
    phone: (formData.get("phone") as string) || null,
    birth_date: (formData.get("birth_date") as string) || null,
    city: (formData.get("city") as string) || null,
    emergency_contact_name: (formData.get("emergency_contact_name") as string) || null,
    emergency_contact_phone: (formData.get("emergency_contact_phone") as string) || null,
    insurance_provider: (formData.get("insurance_provider") as string) || null,
  };
}

export async function createPatient(
  _prev: PatientActionState | undefined,
  formData: FormData,
): Promise<PatientActionState> {
  const { clinicId, supabase } = await staffClinicId();
  const fields = parsePatientForm(formData);
  if (!fields.full_name) return { error: "El nombre completo es obligatorio." };

  const { error } = await supabase.from("patients").insert({ clinic_id: clinicId, ...fields });
  if (error) return { error: "No pudimos registrar el paciente." };

  revalidatePath("/dashboard/pacientes");
  return { success: true };
}

export async function updatePatient(
  id: string,
  _prev: PatientActionState | undefined,
  formData: FormData,
): Promise<PatientActionState> {
  const { clinicId, profileId, supabase } = await staffClinicId();
  const fields = parsePatientForm(formData);
  const status = formData.get("status") === "on" ? "active" : "inactive";
  if (!fields.full_name) return { error: "El nombre completo es obligatorio." };

  const { data: before } = await supabase.from("patients").select("*").eq("id", id).maybeSingle();

  const { error } = await supabase.from("patients").update({ ...fields, status }).eq("id", id);
  if (error) return { error: "No pudimos actualizar el paciente." };

  await logAudit({
    clinicId,
    actorProfileId: profileId,
    action: "update",
    entityType: "patients",
    entityId: id,
    beforeData: before ?? null,
    afterData: fields,
  });

  revalidatePath("/dashboard/pacientes");
  revalidatePath(`/dashboard/pacientes/${id}`);
  return { success: true };
}

export async function updatePatientNotes(id: string, notes: string): Promise<void> {
  const { supabase } = await staffClinicId();
  await supabase.from("patients").update({ administrative_notes: notes }).eq("id", id);
  revalidatePath(`/dashboard/pacientes/${id}`);
}

export async function deletePatient(id: string): Promise<void> {
  const { clinicId, profileId, supabase } = await staffClinicId();
  await supabase.from("patients").update({ deleted_at: new Date().toISOString() }).eq("id", id);

  await logAudit({
    clinicId,
    actorProfileId: profileId,
    action: "soft_delete",
    entityType: "patients",
    entityId: id,
  });

  revalidatePath("/dashboard/pacientes");
}

export async function uploadPatientDocument(
  patientId: string,
  _prev: PatientActionState | undefined,
  formData: FormData,
): Promise<PatientActionState> {
  const { clinicId, supabase } = await documentClinicId();
  const file = formData.get("file") as File | null;
  const documentType = (formData.get("document_type") as string) || null;
  const isClinical = formData.get("is_clinical") === "on";

  if (!file || file.size === 0) return { error: "Selecciona un archivo." };
  if (file.size > MAX_PATIENT_DOCUMENT_BYTES) {
    return { error: `El archivo supera el tamaño máximo permitido (${formatMaxSize(MAX_PATIENT_DOCUMENT_BYTES)}).` };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = `${clinicId}/${patientId}/${Date.now()}-${file.name}`;
  const { error: uploadError } = await supabase.storage.from("clinical-documents").upload(path, file);
  if (uploadError) return { error: "No pudimos subir el archivo." };

  // file_url guarda solo la ruta del bucket privado; las URLs firmadas se
  // generan al momento de mostrar la lista (createSignedUrl expira, no debe
  // guardarse como si fuera permanente).
  const { error } = await supabase.from("patient_documents").insert({
    clinic_id: clinicId,
    patient_id: patientId,
    uploaded_by: user?.id ?? null,
    file_url: path,
    file_name: file.name,
    document_type: documentType,
    is_clinical: isClinical,
  });

  if (error) return { error: "No pudimos registrar el documento." };

  revalidatePath(`/dashboard/pacientes/${patientId}`);
  return { success: true };
}

export async function deletePatientDocument(patientId: string, id: string): Promise<void> {
  const { clinicId, profileId, supabase } = await documentClinicId();

  const { data: doc } = await supabase.from("patient_documents").select("file_url").eq("id", id).maybeSingle();

  await supabase.from("patient_documents").update({ deleted_at: new Date().toISOString() }).eq("id", id);

  if (doc?.file_url) {
    await supabase.storage.from("clinical-documents").remove([doc.file_url]);
  }

  await logAudit({
    clinicId,
    actorProfileId: profileId,
    action: "soft_delete",
    entityType: "patient_documents",
    entityId: id,
  });

  revalidatePath(`/dashboard/pacientes/${patientId}`);
}

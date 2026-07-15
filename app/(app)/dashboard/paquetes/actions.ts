"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/session";

export type PackageActionState = { error?: string; success?: boolean };

const STAFF_ROLES = ["clinic_owner", "assistant", "receptionist", "professional"] as const;

async function staffClinicId() {
  const profile = await requireRole([...STAFF_ROLES]);
  const supabase = await createClient();
  return { clinicId: profile.clinicId!, supabase };
}

export async function createPackage(
  _prev: PackageActionState | undefined,
  formData: FormData,
): Promise<PackageActionState> {
  const { clinicId, supabase } = await staffClinicId();

  const patientId = formData.get("patient_id") as string;
  const professionalId = formData.get("professional_id") as string;
  const name = (formData.get("name") as string)?.trim();
  const totalSessions = Number(formData.get("total_sessions"));

  if (!patientId) return { error: "Selecciona un paciente." };
  if (!professionalId) return { error: "Selecciona un profesional." };
  if (!name) return { error: "El nombre del paquete es obligatorio." };
  if (!totalSessions || totalSessions <= 0) return { error: "El número de sesiones debe ser mayor a 0." };

  const { error } = await supabase.from("session_packages").insert({
    clinic_id: clinicId,
    patient_id: patientId,
    professional_id: professionalId,
    service_id: (formData.get("service_id") as string) || null,
    name,
    total_sessions: totalSessions,
    price_total: Number(formData.get("price_total")) || 0,
    deposit_amount: Number(formData.get("deposit_amount")) || 0,
    valid_until: (formData.get("valid_until") as string) || null,
  });

  if (error) return { error: "No pudimos crear el paquete." };

  revalidatePath("/dashboard/paquetes");
  return { success: true };
}

export async function registerPackageSession(packageId: string): Promise<void> {
  const { clinicId, supabase } = await staffClinicId();

  const { data: pkg } = await supabase
    .from("session_packages")
    .select("sessions_used, total_sessions")
    .eq("id", packageId)
    .single();

  if (!pkg || pkg.sessions_used >= pkg.total_sessions) return;

  await supabase.from("package_sessions").insert({
    clinic_id: clinicId,
    package_id: packageId,
    session_number: pkg.sessions_used + 1,
  });

  revalidatePath("/dashboard/paquetes");
}

export async function updatePackageStatus(
  id: string,
  status: "active" | "completed" | "paused" | "expired" | "cancelled",
): Promise<void> {
  const { supabase } = await staffClinicId();
  await supabase.from("session_packages").update({ status }).eq("id", id);
  revalidatePath("/dashboard/paquetes");
}

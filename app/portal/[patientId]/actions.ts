"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient, createAdminClient } from "@/lib/supabase/server";

export type PortalActionState = { error?: string };

export async function signOutPortal() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/portal/login");
}

/**
 * El paciente solo puede retirar su consentimiento, nunca modificar la
 * evidencia de aceptación (fecha, versión, IP) — por eso el UPDATE se hace
 * con el cliente admin desde el servidor tras verificar la sesión, en vez de
 * darle al portal una política de UPDATE directa sobre consent_records.
 */
export async function revokeConsent(consentId: string, patientId: string): Promise<PortalActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Tu sesión expiró. Vuelve a ingresar." };

  const { data: patient } = await supabase
    .from("patients")
    .select("id")
    .eq("id", patientId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!patient) return { error: "No pudimos verificar tu identidad." };

  const admin = createAdminClient();
  const { data: record } = await admin
    .from("consent_records")
    .select("id, patient_id")
    .eq("id", consentId)
    .eq("patient_id", patientId)
    .maybeSingle();
  if (!record) return { error: "No encontramos ese consentimiento." };

  await admin.from("consent_records").update({ revoked_at: new Date().toISOString() }).eq("id", consentId);

  revalidatePath(`/portal/${patientId}`);
  return {};
}

"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/session";
import { encryptCredentials, decryptCredentials } from "@/lib/payments/crypto";
import { WompiProvider } from "@/lib/payments/providers/wompi";
import { logAudit } from "@/lib/security/audit";

export type PaymentsActionState = { error?: string; success?: boolean; message?: string };

async function ownerClinicId() {
  const profile = await requireRole(["clinic_owner", "finance_user"]);
  const supabase = await createClient();
  return { clinicId: profile.clinicId!, profileId: profile.id, supabase };
}

export async function configureManualTransfer(
  _prev: PaymentsActionState | undefined,
  formData: FormData,
): Promise<PaymentsActionState> {
  const { clinicId, supabase } = await ownerClinicId();
  const instructions = (formData.get("instructions") as string)?.trim();
  if (!instructions) return { error: "Escribe las instrucciones para transferencia." };

  const { data: provider, error } = await supabase
    .from("payment_providers")
    .upsert(
      { clinic_id: clinicId, provider_key: "manual_transfer", display_name: "Transferencia bancaria", is_active: true, is_sandbox: false },
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
    await supabase.from("payment_methods").update({ instructions, is_active: true }).eq("id", existingMethod.id);
  } else {
    await supabase.from("payment_methods").insert({
      clinic_id: clinicId,
      payment_provider_id: provider.id,
      label: "Transferencia bancaria",
      instructions,
      is_active: true,
    });
  }

  revalidatePath("/dashboard/pagos");
  return { success: true };
}

export async function toggleInPerson(isActive: boolean): Promise<void> {
  const { clinicId, supabase } = await ownerClinicId();
  await supabase
    .from("payment_providers")
    .upsert(
      { clinic_id: clinicId, provider_key: "in_person", display_name: "Pago presencial", is_active: isActive, is_sandbox: false },
      { onConflict: "clinic_id,provider_key" },
    );
  revalidatePath("/dashboard/pagos");
}

export async function configureWompi(
  _prev: PaymentsActionState | undefined,
  formData: FormData,
): Promise<PaymentsActionState> {
  const { clinicId, profileId, supabase } = await ownerClinicId();
  const publicKey = (formData.get("public_key") as string)?.trim();
  const privateKey = (formData.get("private_key") as string)?.trim();
  const eventsSecret = (formData.get("events_secret") as string)?.trim();
  const integritySecret = (formData.get("integrity_secret") as string)?.trim();
  const isSandbox = formData.get("is_sandbox") === "on";

  if (!publicKey || !privateKey || !integritySecret) {
    return { error: "La llave pública, la llave privada y el secreto de integridad son obligatorios." };
  }

  const encrypted = encryptCredentials({ publicKey, privateKey, eventsSecret: eventsSecret ?? "", integritySecret });

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

  await logAudit({
    clinicId,
    actorProfileId: profileId,
    action: "configure_credentials",
    entityType: "payment_providers",
    afterData: { provider_key: "wompi", is_sandbox: isSandbox },
  });

  revalidatePath("/dashboard/pagos");
  return { success: true };
}

export async function toggleWompiActive(isActive: boolean): Promise<void> {
  const { clinicId, profileId, supabase } = await ownerClinicId();
  await supabase.from("payment_providers").update({ is_active: isActive }).eq("clinic_id", clinicId).eq("provider_key", "wompi");

  await logAudit({
    clinicId,
    actorProfileId: profileId,
    action: isActive ? "activate" : "deactivate",
    entityType: "payment_providers",
    afterData: { provider_key: "wompi", is_active: isActive },
  });

  revalidatePath("/dashboard/pagos");
}

export async function testWompiConnection(): Promise<PaymentsActionState> {
  const { clinicId, supabase } = await ownerClinicId();
  const { data: providerRow } = await supabase
    .from("payment_providers")
    .select("*")
    .eq("clinic_id", clinicId)
    .eq("provider_key", "wompi")
    .maybeSingle();

  if (!providerRow?.encrypted_credentials) return { error: "Configura Wompi primero." };

  const creds = decryptCredentials(providerRow.encrypted_credentials);
  const provider = new WompiProvider(
    { publicKey: creds.publicKey, privateKey: creds.privateKey, eventsSecret: creds.eventsSecret, integritySecret: creds.integritySecret },
    providerRow.is_sandbox,
  );

  const result = await provider.testConnection();
  return result.ok ? { success: true, message: result.message } : { error: result.message };
}

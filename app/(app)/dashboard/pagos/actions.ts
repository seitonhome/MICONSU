"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/session";
import { encryptCredentials, decryptCredentials } from "@/lib/payments/crypto";
import { WompiProvider } from "@/lib/payments/providers/wompi";
import { EpaycoProvider } from "@/lib/payments/providers/epayco";
import { MercadoPagoProvider } from "@/lib/payments/providers/mercado-pago";
import { logAudit } from "@/lib/security/audit";
import type { Database } from "@/lib/supabase/types";

export type PaymentsActionState = { error?: string; success?: boolean; message?: string };

type ProviderKey = Database["public"]["Tables"]["payment_providers"]["Row"]["provider_key"];

async function ownerClinicId() {
  const profile = await requireRole(["clinic_owner", "finance_user"]);
  const supabase = await createClient();
  return { clinicId: profile.clinicId!, profileId: profile.id, supabase };
}

/**
 * Al editar credenciales (ej. rotar una llave) el upsert no debe reactivar
 * una pasarela que el dueño apagó a propósito con el switch — solo activa
 * por defecto (true) la primera vez que se configura, cuando todavía no
 * existe la fila.
 */
async function preserveActiveOnUpdate(
  supabase: Awaited<ReturnType<typeof createClient>>,
  clinicId: string,
  providerKey: ProviderKey,
): Promise<boolean> {
  const { data: existing } = await supabase
    .from("payment_providers")
    .select("is_active")
    .eq("clinic_id", clinicId)
    .eq("provider_key", providerKey)
    .maybeSingle();
  return existing ? existing.is_active : true;
}

export async function configureManualTransfer(
  _prev: PaymentsActionState | undefined,
  formData: FormData,
): Promise<PaymentsActionState> {
  const { clinicId, supabase } = await ownerClinicId();
  const instructions = (formData.get("instructions") as string)?.trim();
  if (!instructions) return { error: "Escribe las instrucciones para transferencia." };

  const isActive = await preserveActiveOnUpdate(supabase, clinicId, "manual_transfer");
  const { data: provider, error } = await supabase
    .from("payment_providers")
    .upsert(
      { clinic_id: clinicId, provider_key: "manual_transfer", display_name: "Transferencia bancaria", is_active: isActive, is_sandbox: false },
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

export async function toggleManualTransferActive(isActive: boolean): Promise<void> {
  const { clinicId, supabase } = await ownerClinicId();
  await supabase.from("payment_providers").update({ is_active: isActive }).eq("clinic_id", clinicId).eq("provider_key", "manual_transfer");
  revalidatePath("/dashboard/pagos");
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
  const isActive = await preserveActiveOnUpdate(supabase, clinicId, "wompi");

  const { error } = await supabase.from("payment_providers").upsert(
    {
      clinic_id: clinicId,
      provider_key: "wompi",
      display_name: "Wompi",
      is_active: isActive,
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

export async function configureMercadoPago(
  _prev: PaymentsActionState | undefined,
  formData: FormData,
): Promise<PaymentsActionState> {
  const { clinicId, profileId, supabase } = await ownerClinicId();
  const accessToken = (formData.get("access_token") as string)?.trim();
  const webhookSecret = (formData.get("webhook_secret") as string)?.trim();
  const isSandbox = formData.get("is_sandbox") === "on";

  if (!accessToken) return { error: "El access token es obligatorio." };

  const encrypted = encryptCredentials({ accessToken, webhookSecret: webhookSecret ?? "" });
  const isActive = await preserveActiveOnUpdate(supabase, clinicId, "mercado_pago");

  const { error } = await supabase.from("payment_providers").upsert(
    {
      clinic_id: clinicId,
      provider_key: "mercado_pago",
      display_name: "Mercado Pago",
      is_active: isActive,
      is_sandbox: isSandbox,
      encrypted_credentials: encrypted,
    },
    { onConflict: "clinic_id,provider_key" },
  );

  if (error) return { error: "No pudimos guardar la configuración de Mercado Pago." };

  await logAudit({
    clinicId,
    actorProfileId: profileId,
    action: "configure_credentials",
    entityType: "payment_providers",
    afterData: { provider_key: "mercado_pago", is_sandbox: isSandbox },
  });

  revalidatePath("/dashboard/pagos");
  return { success: true };
}

export async function toggleMercadoPagoActive(isActive: boolean): Promise<void> {
  const { clinicId, profileId, supabase } = await ownerClinicId();
  await supabase.from("payment_providers").update({ is_active: isActive }).eq("clinic_id", clinicId).eq("provider_key", "mercado_pago");

  await logAudit({
    clinicId,
    actorProfileId: profileId,
    action: isActive ? "activate" : "deactivate",
    entityType: "payment_providers",
    afterData: { provider_key: "mercado_pago", is_active: isActive },
  });

  revalidatePath("/dashboard/pagos");
}

export async function configureEpayco(
  _prev: PaymentsActionState | undefined,
  formData: FormData,
): Promise<PaymentsActionState> {
  const { clinicId, profileId, supabase } = await ownerClinicId();
  const publicKey = (formData.get("public_key") as string)?.trim();
  const privateKey = (formData.get("private_key") as string)?.trim();
  const customerId = (formData.get("customer_id") as string)?.trim();
  const isSandbox = formData.get("is_sandbox") === "on";

  if (!publicKey || !privateKey || !customerId) {
    return { error: "La llave pública, la llave privada (p_key) y el ID de cliente son obligatorios." };
  }

  const encrypted = encryptCredentials({ publicKey, privateKey, customerId });
  const isActive = await preserveActiveOnUpdate(supabase, clinicId, "epayco");

  const { error } = await supabase.from("payment_providers").upsert(
    {
      clinic_id: clinicId,
      provider_key: "epayco",
      display_name: "ePayco",
      is_active: isActive,
      is_sandbox: isSandbox,
      encrypted_credentials: encrypted,
    },
    { onConflict: "clinic_id,provider_key" },
  );

  if (error) return { error: "No pudimos guardar la configuración de ePayco." };

  await logAudit({
    clinicId,
    actorProfileId: profileId,
    action: "configure_credentials",
    entityType: "payment_providers",
    afterData: { provider_key: "epayco", is_sandbox: isSandbox },
  });

  revalidatePath("/dashboard/pagos");
  return { success: true };
}

export async function toggleEpaycoActive(isActive: boolean): Promise<void> {
  const { clinicId, profileId, supabase } = await ownerClinicId();
  await supabase.from("payment_providers").update({ is_active: isActive }).eq("clinic_id", clinicId).eq("provider_key", "epayco");

  await logAudit({
    clinicId,
    actorProfileId: profileId,
    action: isActive ? "activate" : "deactivate",
    entityType: "payment_providers",
    afterData: { provider_key: "epayco", is_active: isActive },
  });

  revalidatePath("/dashboard/pagos");
}

export async function configureExternalLink(
  _prev: PaymentsActionState | undefined,
  formData: FormData,
): Promise<PaymentsActionState> {
  const { clinicId, profileId, supabase } = await ownerClinicId();
  const linkUrl = (formData.get("link_url") as string)?.trim();

  if (!linkUrl || !/^https?:\/\//.test(linkUrl)) {
    return { error: "Ingresa una URL válida (debe empezar con http:// o https://)." };
  }

  const encrypted = encryptCredentials({ linkUrl });
  const isActive = await preserveActiveOnUpdate(supabase, clinicId, "external_link");

  const { error } = await supabase.from("payment_providers").upsert(
    {
      clinic_id: clinicId,
      provider_key: "external_link",
      display_name: "Link externo de pago",
      is_active: isActive,
      is_sandbox: false,
      encrypted_credentials: encrypted,
    },
    { onConflict: "clinic_id,provider_key" },
  );

  if (error) return { error: "No pudimos guardar el link de pago." };

  await logAudit({
    clinicId,
    actorProfileId: profileId,
    action: "configure_credentials",
    entityType: "payment_providers",
    afterData: { provider_key: "external_link" },
  });

  revalidatePath("/dashboard/pagos");
  return { success: true };
}

export async function toggleExternalLinkActive(isActive: boolean): Promise<void> {
  const { clinicId, profileId, supabase } = await ownerClinicId();
  await supabase.from("payment_providers").update({ is_active: isActive }).eq("clinic_id", clinicId).eq("provider_key", "external_link");

  await logAudit({
    clinicId,
    actorProfileId: profileId,
    action: isActive ? "activate" : "deactivate",
    entityType: "payment_providers",
    afterData: { provider_key: "external_link", is_active: isActive },
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

export async function testEpaycoConnection(): Promise<PaymentsActionState> {
  const { clinicId, supabase } = await ownerClinicId();
  const { data: providerRow } = await supabase
    .from("payment_providers")
    .select("*")
    .eq("clinic_id", clinicId)
    .eq("provider_key", "epayco")
    .maybeSingle();

  if (!providerRow?.encrypted_credentials) return { error: "Configura ePayco primero." };

  const creds = decryptCredentials(providerRow.encrypted_credentials);
  const provider = new EpaycoProvider(
    { publicKey: creds.publicKey, privateKey: creds.privateKey, customerId: creds.customerId },
    providerRow.is_sandbox,
  );

  const result = await provider.testConnection();
  return result.ok ? { success: true, message: result.message } : { error: result.message };
}

export async function testMercadoPagoConnection(): Promise<PaymentsActionState> {
  const { clinicId, supabase } = await ownerClinicId();
  const { data: providerRow } = await supabase
    .from("payment_providers")
    .select("*")
    .eq("clinic_id", clinicId)
    .eq("provider_key", "mercado_pago")
    .maybeSingle();

  if (!providerRow?.encrypted_credentials) return { error: "Configura Mercado Pago primero." };

  const creds = decryptCredentials(providerRow.encrypted_credentials);
  const provider = new MercadoPagoProvider(
    { accessToken: creds.accessToken, webhookSecret: creds.webhookSecret ?? "" },
    providerRow.is_sandbox,
  );

  const result = await provider.testConnection();
  return result.ok ? { success: true, message: result.message } : { error: result.message };
}

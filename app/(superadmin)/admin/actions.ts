"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireRole, requireCurrentProfile } from "@/lib/auth/session";
import type { Database } from "@/lib/supabase/types";

export type AdminActionState = { error?: string; success?: boolean };

async function superAdminClient() {
  await requireRole(["super_admin"]);
  return createClient();
}

export async function upsertLicense(
  clinicId: string,
  _prev: AdminActionState | undefined,
  formData: FormData,
): Promise<AdminActionState> {
  const supabase = await superAdminClient();

  const licenseType = formData.get("license_type") as "esencial" | "profesional" | "centro";
  const status = formData.get("status") as Database["public"]["Tables"]["licenses"]["Row"]["status"];
  const professionalsAllowed = Number(formData.get("professionals_allowed")) || 1;
  const locationsAllowed = Number(formData.get("locations_allowed")) || 1;
  const internalNotes = (formData.get("internal_notes") as string) || null;

  const { error } = await supabase.from("licenses").upsert(
    {
      clinic_id: clinicId,
      license_type: licenseType,
      status,
      professionals_allowed: professionalsAllowed,
      locations_allowed: locationsAllowed,
      internal_notes: internalNotes,
      purchased_at: new Date().toISOString(),
    },
    { onConflict: "clinic_id" },
  );

  if (error) return { error: "No pudimos guardar la licencia." };

  revalidatePath(`/admin/consultorios/${clinicId}`);
  return { success: true };
}

export async function upsertSupportSubscription(
  clinicId: string,
  _prev: AdminActionState | undefined,
  formData: FormData,
): Promise<AdminActionState> {
  const supabase = await superAdminClient();

  const planKey = formData.get("plan_key") as "esencial" | "profesional" | "centro";
  const status = formData.get("status") as Database["public"]["Tables"]["support_subscriptions"]["Row"]["status"];
  const endsAt = (formData.get("ends_at") as string) || null;

  const { data: plan } = await supabase.from("support_plans").select("id").eq("plan_key", planKey).single();
  if (!plan) return { error: "Plan de soporte no encontrado." };

  const { error } = await supabase.from("support_subscriptions").upsert(
    {
      clinic_id: clinicId,
      support_plan_id: plan.id,
      status,
      ends_at: endsAt,
    },
    { onConflict: "clinic_id" },
  );

  if (error) return { error: "No pudimos guardar la suscripción de soporte." };

  revalidatePath(`/admin/consultorios/${clinicId}`);
  return { success: true };
}

export async function toggleModule(
  clinicId: string,
  moduleKey: Database["public"]["Enums"]["module_key"],
  isActive: boolean,
): Promise<void> {
  const supabase = await superAdminClient();

  await supabase.from("enabled_modules").upsert(
    {
      clinic_id: clinicId,
      module_key: moduleKey,
      is_active: isActive,
      activated_at: new Date().toISOString(),
      deactivated_at: isActive ? null : new Date().toISOString(),
    },
    { onConflict: "clinic_id,module_key" },
  );

  revalidatePath(`/admin/consultorios/${clinicId}`);
}

export async function updateTicketStatus(
  ticketId: string,
  status: Database["public"]["Enums"]["support_ticket_status"],
): Promise<void> {
  await requireRole(["super_admin"]);
  const supabase = await createClient();

  const patch: Database["public"]["Tables"]["support_tickets"]["Update"] = { status };
  if (status === "resolved" || status === "closed") patch.resolved_at = new Date().toISOString();

  await supabase.from("support_tickets").update(patch).eq("id", ticketId);
  revalidatePath(`/admin/soporte/${ticketId}`);
  revalidatePath("/admin/soporte");
}

export async function assignTicketToSelf(ticketId: string): Promise<void> {
  const profile = await requireCurrentProfile();
  const supabase = await createClient();

  await supabase
    .from("support_tickets")
    .update({ assigned_to: profile.id, first_response_at: new Date().toISOString() })
    .eq("id", ticketId)
    .is("first_response_at", null);

  revalidatePath(`/admin/soporte/${ticketId}`);
}

export async function addAdminComment(
  ticketId: string,
  _prev: AdminActionState | undefined,
  formData: FormData,
): Promise<AdminActionState> {
  const profile = await requireCurrentProfile();
  const supabase = await createClient();
  const body = (formData.get("body") as string)?.trim();
  const isInternal = formData.get("is_internal") === "on";

  if (!body) return { error: "Escribe un mensaje." };

  const { error } = await supabase.from("support_ticket_comments").insert({
    ticket_id: ticketId,
    author_profile_id: profile.id,
    body,
    is_internal: isInternal,
  });

  if (error) return { error: "No pudimos enviar el mensaje." };

  await supabase
    .from("support_tickets")
    .update({ first_response_at: new Date().toISOString() })
    .eq("id", ticketId)
    .is("first_response_at", null);

  revalidatePath(`/admin/soporte/${ticketId}`);
  return { success: true };
}

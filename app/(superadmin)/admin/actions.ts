"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireRole, requireCurrentProfile } from "@/lib/auth/session";
import { logAudit } from "@/lib/security/audit";
import { forwardTicketStatusToSeitonPqr } from "@/lib/integrations/seiton-pqr";
import type { Database } from "@/lib/supabase/types";

export type AdminActionState = { error?: string; success?: boolean };

async function superAdminProfile() {
  return requireRole(["super_admin"]);
}

export async function upsertLicense(
  clinicId: string,
  _prev: AdminActionState | undefined,
  formData: FormData,
): Promise<AdminActionState> {
  const actor = await superAdminProfile();
  const supabase = await createClient();

  const licenseType = formData.get("license_type") as "esencial" | "profesional" | "centro";
  const status = formData.get("status") as Database["public"]["Tables"]["licenses"]["Row"]["status"];
  const professionalsAllowed = Number(formData.get("professionals_allowed")) || 1;
  const locationsAllowed = Number(formData.get("locations_allowed")) || 1;
  const internalNotes = (formData.get("internal_notes") as string) || null;
  const endsAtInput = (formData.get("ends_at") as string) || null;
  const endsAt = endsAtInput ? new Date(`${endsAtInput}T23:59:59Z`).toISOString() : null;

  const { data: before } = await supabase.from("licenses").select("*").eq("clinic_id", clinicId).maybeSingle();

  const { data: after, error } = await supabase
    .from("licenses")
    .upsert(
      {
        clinic_id: clinicId,
        license_type: licenseType,
        status,
        professionals_allowed: professionalsAllowed,
        locations_allowed: locationsAllowed,
        internal_notes: internalNotes,
        ends_at: endsAt,
        purchased_at: before?.purchased_at ?? new Date().toISOString(),
      },
      { onConflict: "clinic_id" },
    )
    .select("*")
    .single();

  if (error) return { error: "No pudimos guardar la licencia." };

  await logAudit({
    clinicId,
    actorProfileId: actor.id,
    action: "upsert",
    entityType: "licenses",
    entityId: clinicId,
    beforeData: before ?? null,
    afterData: after,
  });

  revalidatePath(`/admin/consultorios/${clinicId}`);
  return { success: true };
}

export async function upsertSupportSubscription(
  clinicId: string,
  _prev: AdminActionState | undefined,
  formData: FormData,
): Promise<AdminActionState> {
  const actor = await superAdminProfile();
  const supabase = await createClient();

  const planKey = formData.get("plan_key") as "esencial" | "profesional" | "centro";
  const status = formData.get("status") as Database["public"]["Tables"]["support_subscriptions"]["Row"]["status"];
  const endsAt = (formData.get("ends_at") as string) || null;

  const { data: plan } = await supabase.from("support_plans").select("id").eq("plan_key", planKey).single();
  if (!plan) return { error: "Plan de soporte no encontrado." };

  const { data: before } = await supabase
    .from("support_subscriptions")
    .select("*")
    .eq("clinic_id", clinicId)
    .maybeSingle();

  const { data: after, error } = await supabase
    .from("support_subscriptions")
    .upsert(
      {
        clinic_id: clinicId,
        support_plan_id: plan.id,
        status,
        ends_at: endsAt,
      },
      { onConflict: "clinic_id" },
    )
    .select("*")
    .single();

  if (error) return { error: "No pudimos guardar la suscripción de soporte." };

  await supabase.from("support_subscription_renewals").insert({
    clinic_id: clinicId,
    support_plan_id: plan.id,
    status,
    started_at: after.started_at,
    ends_at: endsAt,
    changed_by: actor.id,
  });

  await logAudit({
    clinicId,
    actorProfileId: actor.id,
    action: "upsert",
    entityType: "support_subscriptions",
    entityId: clinicId,
    beforeData: before ?? null,
    afterData: after,
  });

  revalidatePath(`/admin/consultorios/${clinicId}`);
  return { success: true };
}

export async function toggleModule(
  clinicId: string,
  moduleKey: Database["public"]["Enums"]["module_key"],
  isActive: boolean,
): Promise<void> {
  const actor = await superAdminProfile();
  const supabase = await createClient();

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

  await logAudit({
    clinicId,
    actorProfileId: actor.id,
    action: isActive ? "activate" : "deactivate",
    entityType: "enabled_modules",
    entityId: clinicId,
    afterData: { module_key: moduleKey, is_active: isActive },
  });

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

  const { data: ticket } = await supabase
    .from("support_tickets")
    .update(patch)
    .eq("id", ticketId)
    .select("seiton_ticket_id")
    .single();

  if (ticket?.seiton_ticket_id) {
    await forwardTicketStatusToSeitonPqr(ticket.seiton_ticket_id, status);
  }

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

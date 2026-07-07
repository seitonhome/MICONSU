"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/session";

async function staffClinicId() {
  const profile = await requireRole(["clinic_owner", "assistant", "receptionist", "finance_user"]);
  const supabase = await createClient();
  return { clinicId: profile.clinicId!, profileId: profile.id, supabase };
}

export async function confirmPayment(intentId: string): Promise<void> {
  const { clinicId, profileId, supabase } = await staffClinicId();

  const { data: intent } = await supabase
    .from("payment_intents")
    .select("*")
    .eq("id", intentId)
    .eq("clinic_id", clinicId)
    .single();
  if (!intent) return;

  await supabase.from("payments").insert({
    clinic_id: clinicId,
    payment_intent_id: intent.id,
    amount: intent.amount,
    currency: intent.currency,
    method: "manual",
    status: "approved",
    paid_at: new Date().toISOString(),
    confirmed_by: profileId,
  });

  await supabase.from("payment_intents").update({ status: "approved" }).eq("id", intent.id);

  if (intent.appointment_id) {
    await supabase.from("appointments").update({ status: "confirmed" }).eq("id", intent.appointment_id);
  }

  await supabase.from("payment_reconciliation_logs").insert({
    clinic_id: clinicId,
    payment_intent_id: intent.id,
    action: "confirmed",
    performed_by: profileId,
  });

  revalidatePath("/dashboard/pagos/conciliacion");
}

export async function rejectPayment(intentId: string): Promise<void> {
  const { clinicId, profileId, supabase } = await staffClinicId();

  await supabase.from("payment_intents").update({ status: "rejected" }).eq("id", intentId).eq("clinic_id", clinicId);

  await supabase.from("payment_reconciliation_logs").insert({
    clinic_id: clinicId,
    payment_intent_id: intentId,
    action: "rejected",
    performed_by: profileId,
  });

  revalidatePath("/dashboard/pagos/conciliacion");
}

export async function markUnderReview(intentId: string): Promise<void> {
  const { clinicId, profileId, supabase } = await staffClinicId();

  await supabase.from("payment_intents").update({ status: "manual_review" }).eq("id", intentId).eq("clinic_id", clinicId);

  await supabase.from("payment_reconciliation_logs").insert({
    clinic_id: clinicId,
    payment_intent_id: intentId,
    action: "marked_review",
    performed_by: profileId,
  });

  revalidatePath("/dashboard/pagos/conciliacion");
}

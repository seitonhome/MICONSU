import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { getPaymentProvider } from "@/lib/payments/provider-factory";
import { notifyAppointment } from "@/lib/notifications/notify";
import type { Json } from "@/lib/supabase/types";

export async function POST(request: NextRequest) {
  const admin = createAdminClient();
  const { searchParams } = new URL(request.url);
  const ref = searchParams.get("ref");
  const payload = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const payloadJson = payload as unknown as Json;

  const { data: intent } = ref
    ? await admin.from("payment_intents").select("id, clinic_id, appointment_id, amount, currency").eq("id", ref).maybeSingle()
    : { data: null };

  if (!intent) {
    await admin.from("payment_webhooks").insert({
      clinic_id: null,
      provider_key: "mercado_pago",
      payload: payloadJson,
      signature_valid: false,
      processed: false,
      error: "No se encontró payment_intent para la referencia recibida.",
    });
    return NextResponse.json({ ok: true });
  }

  const { data: providerRow } = await admin
    .from("payment_providers")
    .select("*")
    .eq("clinic_id", intent.clinic_id)
    .eq("provider_key", "mercado_pago")
    .maybeSingle();

  const provider = providerRow ? getPaymentProvider(providerRow) : null;

  if (!provider) {
    await admin.from("payment_webhooks").insert({
      clinic_id: intent.clinic_id,
      provider_key: "mercado_pago",
      payload: payloadJson,
      signature_valid: false,
      processed: false,
      error: "Mercado Pago no está configurado para esta clínica.",
    });
    return NextResponse.json({ ok: true });
  }

  const enrichedPayload = {
    ...payload,
    __signatureHeader: request.headers.get("x-signature"),
    __requestId: request.headers.get("x-request-id") ?? undefined,
  };

  const result = await provider.handleWebhook(enrichedPayload);

  const { data: existingEvent } = result.externalEventId
    ? await admin
        .from("payment_webhooks")
        .select("id")
        .eq("provider_key", "mercado_pago")
        .eq("external_event_id", result.externalEventId)
        .maybeSingle()
    : { data: null };

  if (existingEvent) {
    return NextResponse.json({ ok: true, deduplicated: true });
  }

  await admin.from("payment_webhooks").insert({
    clinic_id: intent.clinic_id,
    provider_key: "mercado_pago",
    external_event_id: result.externalEventId ?? null,
    payload: payloadJson,
    signature_valid: result.signatureValid,
    processed: result.signatureValid,
  });

  if (!result.signatureValid || !result.status) {
    return NextResponse.json({ ok: true });
  }

  await admin.from("payment_intents").update({ status: result.status }).eq("id", intent.id);

  await admin.from("payments").insert({
    clinic_id: intent.clinic_id,
    payment_intent_id: intent.id,
    amount: intent.amount,
    currency: intent.currency,
    method: "mercado_pago",
    external_transaction_id: result.externalTransactionId ?? null,
    status: result.status,
    paid_at: result.status === "approved" ? new Date().toISOString() : null,
    raw_provider_response: payloadJson,
  });

  if (intent.appointment_id && result.status === "approved") {
    await admin.from("appointments").update({ status: "confirmed" }).eq("id", intent.appointment_id);
    await notifyAppointment(admin, intent.appointment_id, "payment_approved");
  }

  return NextResponse.json({ ok: true });
}

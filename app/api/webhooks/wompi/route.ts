import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { getPaymentProvider } from "@/lib/payments/provider-factory";
import type { Json } from "@/lib/supabase/types";

export async function POST(request: NextRequest) {
  const admin = createAdminClient();
  const payload = (await request.json()) as Record<string, unknown>;
  // Wompi siempre envía un objeto plano serializable; el cast a Json es seguro
  // para persistir el payload crudo en payment_webhooks/payments.
  const payloadJson = payload as unknown as Json;

  const data = payload.data as
    | { transaction?: { reference?: string; amount_in_cents?: number; currency?: string } }
    | undefined;
  const reference = data?.transaction?.reference;
  const amount = data?.transaction?.amount_in_cents ? data.transaction.amount_in_cents / 100 : 0;
  const currency = data?.transaction?.currency ?? "COP";

  // payment_intents.id es la referencia que enviamos a Wompi al crear el
  // checkout (ver WompiProvider.createCheckoutSession), así que la usamos
  // para encontrar la clínica dueña de este webhook sin necesidad de que
  // Wompi nos la reenvíe explícitamente.
  const { data: intent } = reference
    ? await admin.from("payment_intents").select("id, clinic_id, appointment_id").eq("id", reference).maybeSingle()
    : { data: null };

  if (!intent) {
    await admin.from("payment_webhooks").insert({
      clinic_id: null,
      provider_key: "wompi",
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
    .eq("provider_key", "wompi")
    .maybeSingle();

  const provider = providerRow ? getPaymentProvider(providerRow) : null;

  if (!provider) {
    await admin.from("payment_webhooks").insert({
      clinic_id: intent.clinic_id,
      provider_key: "wompi",
      payload: payloadJson,
      signature_valid: false,
      processed: false,
      error: "Wompi no está configurado para esta clínica.",
    });
    return NextResponse.json({ ok: true });
  }

  const result = await provider.handleWebhook(payload);

  const { data: existingEvent } = result.externalEventId
    ? await admin
        .from("payment_webhooks")
        .select("id")
        .eq("provider_key", "wompi")
        .eq("external_event_id", result.externalEventId)
        .maybeSingle()
    : { data: null };

  if (existingEvent) {
    return NextResponse.json({ ok: true, deduplicated: true });
  }

  await admin.from("payment_webhooks").insert({
    clinic_id: intent.clinic_id,
    provider_key: "wompi",
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
    amount,
    currency,
    method: "wompi",
    external_transaction_id: result.externalTransactionId ?? null,
    status: result.status,
    paid_at: result.status === "approved" ? new Date().toISOString() : null,
    raw_provider_response: payloadJson,
  });

  if (intent.appointment_id && result.status === "approved") {
    await admin.from("appointments").update({ status: "confirmed" }).eq("id", intent.appointment_id);
  }

  return NextResponse.json({ ok: true });
}

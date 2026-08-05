import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { PAYMENT_STATUS_LABELS } from "@/lib/domain/labels";
import { ReconciliationRowActions } from "./reconciliation-row-actions";

export default async function ConciliacionPage() {
  const profile = await requireRole(["clinic_owner", "assistant", "receptionist", "finance_user"]);
  const supabase = await createClient();

  const { data: intents } = await supabase
    .from("payment_intents")
    .select("*")
    .eq("clinic_id", profile.clinicId!)
    .in("status", ["pending", "pending_confirmation", "manual_review"])
    .order("created_at", { ascending: false });

  const patientIds = Array.from(new Set((intents ?? []).map((i) => i.patient_id)));
  const serviceIds = Array.from(new Set((intents ?? []).map((i) => i.service_id).filter((v): v is string => Boolean(v))));
  const providerIds = Array.from(
    new Set((intents ?? []).map((i) => i.payment_provider_id).filter((v): v is string => Boolean(v))),
  );
  const intentIds = (intents ?? []).map((i) => i.id);

  const [{ data: patients }, { data: services }, { data: providers }, { data: proofs }] = await Promise.all([
    patientIds.length > 0
      ? supabase.from("patients").select("id, full_name").in("id", patientIds)
      : Promise.resolve({ data: [] as { id: string; full_name: string }[] }),
    serviceIds.length > 0
      ? supabase.from("services").select("id, name").in("id", serviceIds)
      : Promise.resolve({ data: [] as { id: string; name: string }[] }),
    providerIds.length > 0
      ? supabase.from("payment_providers").select("id, display_name, provider_key").in("id", providerIds)
      : Promise.resolve({ data: [] as { id: string; display_name: string; provider_key: string }[] }),
    intentIds.length > 0
      ? supabase.from("manual_payment_proofs").select("*").in("payment_intent_id", intentIds)
      : Promise.resolve({ data: [] as Array<{ id: string; payment_intent_id: string; file_url: string; notes: string | null; status: string }> }),
  ]);

  const patientById = new Map((patients ?? []).map((p) => [p.id, p.full_name]));
  const serviceById = new Map((services ?? []).map((s) => [s.id, s.name]));
  const providerById = new Map((providers ?? []).map((p) => [p.id, p]));
  const proofsByIntentId = new Map<string, typeof proofs>();
  for (const proof of proofs ?? []) {
    const list = proofsByIntentId.get(proof.payment_intent_id) ?? [];
    list.push(proof);
    proofsByIntentId.set(proof.payment_intent_id, list);
  }

  const intentsWithProofUrls = await Promise.all(
    (intents ?? []).map(async (intent) => {
      const intentProofs = proofsByIntentId.get(intent.id) ?? [];
      const proofsWithUrls = await Promise.all(
        (intentProofs ?? []).map(async (proof) => {
          const { data } = await supabase.storage.from("clinical-documents").createSignedUrl(proof.file_url, 3600);
          return { ...proof, signedUrl: data?.signedUrl ?? null };
        }),
      );
      return { intent, proofs: proofsWithUrls };
    }),
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Conciliación de pagos</h1>
        <p className="mt-1 text-muted-foreground">Confirma o rechaza los pagos que necesitan revisión manual.</p>
      </div>

      {!intents || intents.length === 0 ? (
        <div className="rounded-2xl border border-dashed p-10 text-center">
          <p className="font-medium">No tienes pagos pendientes por confirmar.</p>
        </div>
      ) : (
        <ul className="divide-y rounded-xl border">
          {intentsWithProofUrls.map(({ intent, proofs: intentProofs }) => {
            const provider = intent.payment_provider_id ? providerById.get(intent.payment_provider_id) : null;
            return (
              <li key={intent.id} className="flex items-center justify-between gap-4 px-4 py-3">
                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-medium">{patientById.get(intent.patient_id) ?? "Paciente"}</p>
                    <Badge variant="outline">{PAYMENT_STATUS_LABELS[intent.status]}</Badge>
                    {provider && <Badge variant="secondary">{provider.display_name}</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {intent.service_id ? serviceById.get(intent.service_id) : "Servicio"} · Valor esperado: $
                    {Number(intent.amount).toLocaleString("es-CO")} {intent.currency} ·{" "}
                    {intent.kind === "deposit" ? "Anticipo" : "Pago completo"}
                  </p>
                  {intent.external_reference && (
                    <p className="text-xs text-muted-foreground">Referencia externa: {intent.external_reference}</p>
                  )}
                  {intentProofs.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {intentProofs.map((proof) =>
                        proof.signedUrl ? (
                          <a
                            key={proof.id}
                            href={proof.signedUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs font-medium text-primary underline underline-offset-4"
                          >
                            Ver comprobante{proof.notes ? ` (${proof.notes})` : ""}
                          </a>
                        ) : null,
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground/70">Sin comprobante adjunto.</p>
                  )}
                </div>
                <ReconciliationRowActions id={intent.id} />
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

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

  const [{ data: patients }, { data: services }] = await Promise.all([
    patientIds.length > 0
      ? supabase.from("patients").select("id, full_name").in("id", patientIds)
      : Promise.resolve({ data: [] as { id: string; full_name: string }[] }),
    serviceIds.length > 0
      ? supabase.from("services").select("id, name").in("id", serviceIds)
      : Promise.resolve({ data: [] as { id: string; name: string }[] }),
  ]);

  const patientById = new Map((patients ?? []).map((p) => [p.id, p.full_name]));
  const serviceById = new Map((services ?? []).map((s) => [s.id, s.name]));

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
          {intents.map((intent) => (
            <li key={intent.id} className="flex items-center justify-between gap-4 px-4 py-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium">{patientById.get(intent.patient_id) ?? "Paciente"}</p>
                  <Badge variant="outline">{PAYMENT_STATUS_LABELS[intent.status]}</Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  {intent.service_id ? serviceById.get(intent.service_id) : "Servicio"} · $
                  {Number(intent.amount).toLocaleString("es-CO")} · {intent.kind === "deposit" ? "Anticipo" : "Pago completo"}
                </p>
              </div>
              <ReconciliationRowActions id={intent.id} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

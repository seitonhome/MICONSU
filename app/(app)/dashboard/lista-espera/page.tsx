import { Users } from "lucide-react";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { getClinicEntitlements, planAtLeast } from "@/lib/modules";
import { ModuleLocked } from "@/components/patterns/module-locked";
import { WaitlistDialog } from "./waitlist-dialog";
import { WaitlistRowActions } from "./waitlist-row-actions";

const STATUS_LABELS = {
  waiting: "Esperando",
  notified: "Notificado",
  booked: "Reservó",
  expired: "Expiró",
  cancelled: "Cancelado",
} as const;

export default async function ListaEsperaPage() {
  const profile = await requireRole(["clinic_owner", "assistant", "receptionist", "professional"]);
  const supabase = await createClient();

  const entitlements = await getClinicEntitlements(profile.clinicId!);
  if (!planAtLeast(entitlements, "profesional")) {
    return <ModuleLocked title="La lista de espera es parte del Plan Profesional." requiredPlan="profesional" />;
  }

  const [{ data: entries }, { data: professionals }, { data: services }, { data: patients }] = await Promise.all([
    supabase
      .from("waitlist_entries")
      .select("*")
      .eq("clinic_id", profile.clinicId!)
      .in("status", ["waiting", "notified"])
      .order("priority", { ascending: false })
      .order("created_at"),
    supabase.from("professionals").select("*").eq("clinic_id", profile.clinicId!).is("deleted_at", null),
    supabase.from("services").select("*").eq("clinic_id", profile.clinicId!).is("deleted_at", null),
    supabase.from("patients").select("*").eq("clinic_id", profile.clinicId!).order("full_name"),
  ]);

  const patientById = new Map((patients ?? []).map((p) => [p.id, p]));
  const professionalById = new Map((professionals ?? []).map((p) => [p.id, p]));
  const serviceById = new Map((services ?? []).map((s) => [s.id, s]));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Lista de espera</h1>
          <p className="mt-1 text-muted-foreground">
            Cuando se cancele una cita, revisa aquí quién puede tomar ese espacio libre.
          </p>
        </div>
        <WaitlistDialog professionals={professionals ?? []} services={services ?? []} patients={patients ?? []} />
      </div>

      {!entries || entries.length === 0 ? (
        <div className="rounded-2xl border border-dashed p-10 text-center">
          <Users className="mx-auto size-8 text-muted-foreground" />
          <p className="mt-3 font-medium">No tienes a nadie en lista de espera.</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Agrega pacientes interesados en un horario o profesional específico para poder recuperar espacios cancelados.
          </p>
        </div>
      ) : (
        <ul className="divide-y rounded-xl border">
          {entries.map((entry) => (
            <li key={entry.id} className="flex items-center justify-between gap-4 px-4 py-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="truncate text-sm font-medium">
                    {patientById.get(entry.patient_id)?.full_name ?? "Paciente"}
                  </p>
                  <Badge variant={entry.status === "notified" ? "default" : "outline"}>
                    {STATUS_LABELS[entry.status]}
                  </Badge>
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {entry.service_id ? serviceById.get(entry.service_id)?.name : "Cualquier servicio"} ·{" "}
                  {entry.professional_id ? professionalById.get(entry.professional_id)?.full_name : "Cualquier profesional"}
                  {entry.time_preference ? ` · ${entry.time_preference}` : ""}
                </p>
              </div>
              <WaitlistRowActions id={entry.id} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

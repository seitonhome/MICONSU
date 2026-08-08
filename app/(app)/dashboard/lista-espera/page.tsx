import { Users, CalendarX2 } from "lucide-react";
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

  const [{ data: entries }, { data: professionals }, { data: services }, { data: patients }, { data: recentCancellations }] =
    await Promise.all([
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
      // Citas canceladas cuyo horario todavía no pasó — son cupos que
      // literalmente se acaban de liberar y podrían ofrecerse a alguien de
      // la lista de espera, en vez de quedar como dos pantallas separadas
      // que el staff tiene que revisar por su cuenta.
      supabase
        .from("appointments")
        .select("id, starts_at, service_id, professional_id")
        .eq("clinic_id", profile.clinicId!)
        .eq("status", "cancelled")
        .gte("starts_at", new Date().toISOString())
        .order("starts_at")
        .limit(10),
    ]);

  const patientById = new Map((patients ?? []).map((p) => [p.id, p]));
  const professionalById = new Map((professionals ?? []).map((p) => [p.id, p]));
  const serviceById = new Map((services ?? []).map((s) => [s.id, s]));

  const waitingEntries = entries ?? [];
  const cancellationsWithMatches = (recentCancellations ?? []).map((c) => ({
    ...c,
    matchCount: waitingEntries.filter(
      (e) =>
        (!e.professional_id || e.professional_id === c.professional_id) &&
        (!e.service_id || e.service_id === c.service_id),
    ).length,
  }));

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

      {cancellationsWithMatches.length > 0 && (
        <div className="rounded-xl border border-dashed p-4">
          <div className="mb-2 flex items-center gap-2 text-sm font-medium">
            <CalendarX2 className="size-4 text-muted-foreground" />
            Cupos recién liberados
          </div>
          <ul className="space-y-1.5 text-sm text-muted-foreground">
            {cancellationsWithMatches.map((c) => (
              <li key={c.id} className="flex flex-wrap items-center justify-between gap-2">
                <span>
                  {new Date(c.starts_at).toLocaleString("es-CO", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })} ·{" "}
                  {serviceById.get(c.service_id)?.name ?? "Servicio"} · {professionalById.get(c.professional_id)?.full_name ?? "Profesional"}
                </span>
                {c.matchCount > 0 && (
                  <Badge variant="outline">{c.matchCount} en lista de espera podría{c.matchCount === 1 ? "" : "n"} tomarlo</Badge>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

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
              <WaitlistRowActions
                id={entry.id}
                patientName={patientById.get(entry.patient_id)?.full_name ?? "este paciente"}
                preferredProfessionalId={entry.professional_id}
                preferredServiceId={entry.service_id}
                professionals={professionals ?? []}
                services={services ?? []}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

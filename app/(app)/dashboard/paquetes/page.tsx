import { PackageOpen } from "lucide-react";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { getClinicEntitlements, planAtLeast, hasModule } from "@/lib/modules";
import { ModuleLocked } from "@/components/patterns/module-locked";
import { PackageDialog } from "./package-dialog";
import { PackageRowActions } from "./package-row-actions";

const STATUS_LABELS = {
  active: "Activo",
  completed: "Completado",
  paused: "Pausado",
  expired: "Vencido",
  cancelled: "Cancelado",
} as const;

export default async function PaquetesPage() {
  const profile = await requireRole(["clinic_owner", "assistant", "receptionist", "professional"]);
  const supabase = await createClient();

  const entitlements = await getClinicEntitlements(profile.clinicId!);
  if (!planAtLeast(entitlements, "profesional") || !hasModule(entitlements, "advanced_therapeutic_packages")) {
    return (
      <ModuleLocked
        title="Los paquetes de sesiones son un módulo adicional."
        requiredPlan="profesional"
        moduleLabel="Paquetes terapéuticos avanzados"
      />
    );
  }

  const [{ data: packages }, { data: patients }, { data: professionals }, { data: services }] = await Promise.all([
    supabase
      .from("session_packages")
      .select("*")
      .eq("clinic_id", profile.clinicId!)
      .order("created_at", { ascending: false }),
    supabase.from("patients").select("*").eq("clinic_id", profile.clinicId!).order("full_name"),
    supabase.from("professionals").select("*").eq("clinic_id", profile.clinicId!).is("deleted_at", null),
    supabase.from("services").select("*").eq("clinic_id", profile.clinicId!).is("deleted_at", null),
  ]);

  const patientById = new Map((patients ?? []).map((p) => [p.id, p]));
  const professionalById = new Map((professionals ?? []).map((p) => [p.id, p]));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Paquetes de sesiones</h1>
          <p className="mt-1 text-muted-foreground">
            Vende procesos completos, no solo citas sueltas, y controla cuántas sesiones le quedan a cada paciente.
          </p>
        </div>
        <PackageDialog patients={patients ?? []} professionals={professionals ?? []} services={services ?? []} />
      </div>

      {!packages || packages.length === 0 ? (
        <div className="rounded-2xl border border-dashed p-10 text-center">
          <PackageOpen className="mx-auto size-8 text-muted-foreground" />
          <p className="mt-3 font-medium">Aún no tienes paquetes creados.</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Crea un paquete para vender procesos completos con seguimiento de sesiones y saldo.
          </p>
        </div>
      ) : (
        <ul className="divide-y rounded-xl border">
          {packages.map((pkg) => {
            const progressPct = Math.min(100, Math.round((pkg.sessions_used / pkg.total_sessions) * 100));
            const isComplete = pkg.sessions_used >= pkg.total_sessions;
            return (
              <li key={pkg.id} className="flex items-center justify-between gap-4 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-medium">{pkg.name}</p>
                    <Badge variant={pkg.status === "active" ? "default" : "outline"}>{STATUS_LABELS[pkg.status]}</Badge>
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {patientById.get(pkg.patient_id)?.full_name ?? "Paciente"} ·{" "}
                    {professionalById.get(pkg.professional_id)?.full_name ?? "Profesional"}
                    {pkg.valid_until ? ` · Vence ${new Date(pkg.valid_until).toLocaleDateString("es-CO")}` : ""}
                  </p>
                  <div className="mt-2 flex max-w-xs items-center gap-2">
                    <Progress value={progressPct} className="h-1.5" />
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {pkg.sessions_used}/{pkg.total_sessions}
                    </span>
                  </div>
                </div>
                <PackageRowActions id={pkg.id} status={pkg.status} isComplete={isComplete} />
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

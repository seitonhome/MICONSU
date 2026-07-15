import { Sparkles } from "lucide-react";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { getClinicEntitlements, planAtLeast } from "@/lib/modules";
import { ModuleLocked } from "@/components/patterns/module-locked";
import { ProcessDialog } from "./process-dialog";
import { ProcessRowActions } from "./process-row-actions";

const STATUS_LABELS = {
  active: "Activo",
  paused: "Pausado",
  completed: "Completado",
  abandoned: "Abandonado",
  cancelled: "Cancelado",
} as const;

export default async function ProcesosPage() {
  const profile = await requireRole(["clinic_owner", "professional"]);
  const supabase = await createClient();

  const entitlements = await getClinicEntitlements(profile.clinicId!);
  if (!planAtLeast(entitlements, "profesional")) {
    return <ModuleLocked title="Los procesos terapéuticos son parte del Plan Profesional." requiredPlan="profesional" />;
  }

  let processesQuery = supabase
    .from("therapeutic_processes")
    .select("*")
    .eq("clinic_id", profile.clinicId!)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (profile.role === "professional") {
    const { data: prof } = await supabase
      .from("professionals")
      .select("id")
      .eq("profile_id", profile.id)
      .single();
    processesQuery = processesQuery.eq("professional_id", prof?.id ?? "");
  }

  const [{ data: processes }, { data: patients }, { data: professionals }] = await Promise.all([
    processesQuery,
    supabase.from("patients").select("*").eq("clinic_id", profile.clinicId!).order("full_name"),
    supabase.from("professionals").select("*").eq("clinic_id", profile.clinicId!).is("deleted_at", null),
  ]);

  const patientById = new Map((patients ?? []).map((p) => [p.id, p]));
  const professionalById = new Map((professionals ?? []).map((p) => [p.id, p]));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Procesos terapéuticos</h1>
          <p className="mt-1 text-muted-foreground">
            Acceso restringido: solo tú y el profesional tratante pueden ver estos procesos.
          </p>
        </div>
        <ProcessDialog patients={patients ?? []} professionals={professionals ?? []} />
      </div>

      {!processes || processes.length === 0 ? (
        <div className="rounded-2xl border border-dashed p-10 text-center">
          <Sparkles className="mx-auto size-8 text-muted-foreground" />
          <p className="mt-3 font-medium">Aún no tienes procesos registrados.</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Crea un proceso para dar seguimiento a un acompañamiento de varias sesiones.
          </p>
        </div>
      ) : (
        <ul className="divide-y rounded-xl border">
          {processes.map((proc) => (
            <li key={proc.id} className="flex items-center justify-between gap-4 px-4 py-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate text-sm font-medium">
                    {patientById.get(proc.patient_id)?.full_name ?? "Paciente"}
                  </p>
                  <Badge variant={proc.status === "active" ? "default" : "outline"}>{STATUS_LABELS[proc.status]}</Badge>
                </div>
                <p className="mt-0.5 truncate text-xs text-muted-foreground">
                  {proc.objective || "Sin objetivo definido"} · {professionalById.get(proc.professional_id)?.full_name ?? "Profesional"}
                  {proc.next_session_at
                    ? ` · Próxima sesión: ${new Date(proc.next_session_at).toLocaleString("es-CO")}`
                    : ""}
                </p>
              </div>
              <ProcessRowActions id={proc.id} status={proc.status} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

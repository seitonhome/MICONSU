import { Heart } from "lucide-react";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { getClinicEntitlements, planAtLeast } from "@/lib/modules";
import { ModuleLocked } from "@/components/patterns/module-locked";
import { FollowupDialog } from "./followup-dialog";
import { FollowupRowActions } from "./followup-row-actions";
import { BADGE_PRIMARY, BADGE_ACCENT, BADGE_OUTLINE } from "@/lib/utils/badge-styles";

const TYPE_LABELS = {
  thank_you: "Agradecimiento",
  satisfaction_survey: "Encuesta de satisfacción",
  review_request: "Solicitud de reseña",
  package_renewal: "Renovación de paquete",
  custom: "Personalizado",
} as const;

const STATUS_LABELS = { pending: "Pendiente", sent: "Enviado", completed: "Completado", skipped: "Omitido" } as const;
const STATUS_BADGE_CLASS: Record<keyof typeof STATUS_LABELS, string> = {
  pending: BADGE_OUTLINE,
  sent: BADGE_PRIMARY,
  completed: BADGE_ACCENT,
  skipped: BADGE_OUTLINE,
};

export default async function SeguimientosPage() {
  const profile = await requireRole(["clinic_owner", "assistant", "receptionist", "professional"]);
  const supabase = await createClient();

  const entitlements = await getClinicEntitlements(profile.clinicId!);
  if (!planAtLeast(entitlements, "profesional")) {
    return <ModuleLocked title="El seguimiento postconsulta es parte del Plan Profesional." requiredPlan="profesional" />;
  }

  const [{ data: followups }, { data: patients }] = await Promise.all([
    supabase
      .from("post_consultation_followups")
      .select("*")
      .eq("clinic_id", profile.clinicId!)
      .order("scheduled_for", { ascending: true }),
    supabase.from("patients").select("*").eq("clinic_id", profile.clinicId!).order("full_name"),
  ]);

  const patientById = new Map((patients ?? []).map((p) => [p.id, p]));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground">Seguimiento postconsulta</h1>
          <p className="mt-1 text-muted-foreground">
            Agradecimientos, encuestas, solicitudes de reseña y renovación de paquetes.
          </p>
        </div>
        <FollowupDialog patients={patients ?? []} />
      </div>

      {!followups || followups.length === 0 ? (
        <div className="rounded-2xl border border-dashed p-10 text-center">
          <Heart className="mx-auto size-8 text-muted-foreground" />
          <p className="mt-3 font-medium">No tienes seguimientos programados.</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Crea un seguimiento para acompañar a tus pacientes después de la consulta.
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-black/[0.06] overflow-hidden rounded-[16px] border border-black/[0.07] bg-card">
          {followups.map((f) => (
            <li key={f.id} className="flex items-center justify-between gap-4 px-5 py-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate text-[13.5px] font-semibold text-foreground/90">{patientById.get(f.patient_id)?.full_name ?? "Paciente"}</p>
                  <Badge variant="outline" className={STATUS_BADGE_CLASS[f.status]}>{STATUS_LABELS[f.status]}</Badge>
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {TYPE_LABELS[f.followup_type]} · {new Date(f.scheduled_for).toLocaleString("es-CO")}
                </p>
              </div>
              <FollowupRowActions id={f.id} status={f.status} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

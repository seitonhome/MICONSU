import { Star } from "lucide-react";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { getClinicEntitlements, planAtLeast } from "@/lib/modules";
import { ModuleLocked } from "@/components/patterns/module-locked";
import { ReviewDialog } from "./review-dialog";
import { ReviewRowActions } from "./review-row-actions";

const STATUS_LABELS = { private: "Privada", approved: "Aprobada", featured: "Destacada" } as const;

export default async function ResenasPage() {
  const profile = await requireRole(["clinic_owner", "assistant", "receptionist"]);
  const supabase = await createClient();

  const entitlements = await getClinicEntitlements(profile.clinicId!);
  if (!planAtLeast(entitlements, "profesional")) {
    return <ModuleLocked title="Las reseñas son parte del Plan Profesional." requiredPlan="profesional" />;
  }

  const [{ data: reviews }, { data: patients }, { data: professionals }, { data: services }] = await Promise.all([
    supabase.from("reviews").select("*").eq("clinic_id", profile.clinicId!).order("created_at", { ascending: false }),
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
          <h1 className="text-2xl font-semibold">Reseñas</h1>
          <p className="mt-1 text-muted-foreground">
            Nacen privadas: apruébalas o destácalas antes de mostrarlas en tu página pública.
          </p>
        </div>
        <ReviewDialog patients={patients ?? []} professionals={professionals ?? []} services={services ?? []} />
      </div>

      {!reviews || reviews.length === 0 ? (
        <div className="rounded-2xl border border-dashed p-10 text-center">
          <Star className="mx-auto size-8 text-muted-foreground" />
          <p className="mt-3 font-medium">Aún no tienes reseñas registradas.</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Cuando tus pacientes dejen una reseña, aparecerá aquí para que la revises antes de publicarla.
          </p>
        </div>
      ) : (
        <ul className="divide-y rounded-xl border">
          {reviews.map((r) => (
            <li key={r.id} className="flex items-center justify-between gap-4 px-4 py-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-amber-500">{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}</span>
                  <Badge variant={r.status === "private" ? "outline" : "secondary"}>{STATUS_LABELS[r.status]}</Badge>
                </div>
                <p className="mt-0.5 truncate text-sm">{r.comment || "Sin comentario"}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {r.patient_id ? patientById.get(r.patient_id)?.full_name ?? "Paciente" : "Anónimo"}
                  {r.professional_id ? ` · ${professionalById.get(r.professional_id)?.full_name}` : ""}
                </p>
              </div>
              <ReviewRowActions id={r.id} status={r.status} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

import { Stethoscope, Trash2 } from "lucide-react";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PRACTITIONER_TYPE_LABELS, type PractitionerType } from "@/lib/auth/roles";
import { ProfessionalDialog } from "./professional-dialog";
import { deleteProfessional } from "./actions";

export default async function ProfesionalesPage() {
  const profile = await requireRole(["clinic_owner"]);
  const supabase = await createClient();

  const [{ data: professionals }, { data: clinic }] = await Promise.all([
    supabase
      .from("professionals")
      .select("*")
      .eq("clinic_id", profile.clinicId!)
      .is("deleted_at", null)
      .order("full_name"),
    supabase.from("clinics").select("primary_practitioner_type").eq("id", profile.clinicId!).maybeSingle(),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Profesionales</h1>
          <p className="mt-1 text-muted-foreground">
            Quién atiende en tu consultorio. Aparecen en tu agenda, tu página pública y la reserva de pacientes.
          </p>
        </div>
        <ProfessionalDialog
          defaultPractitionerType={(clinic?.primary_practitioner_type as PractitionerType) ?? null}
        />
      </div>

      {!professionals || professionals.length === 0 ? (
        <div className="rounded-2xl border border-dashed p-10 text-center">
          <Stethoscope className="mx-auto size-8 text-muted-foreground" />
          <p className="mt-3 font-medium">Aún no tienes profesionales registrados.</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Agrega al menos uno para poder recibir reservas y agendar citas.
          </p>
        </div>
      ) : (
        <ul className="divide-y rounded-xl border">
          {professionals.map((p) => (
            <li key={p.id} className="flex items-center justify-between gap-4 px-4 py-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{p.full_name}</p>
                <p className="text-xs text-muted-foreground">
                  {PRACTITIONER_TYPE_LABELS[p.practitioner_type]}
                  {p.specialty_label ? ` · ${p.specialty_label}` : ""}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <Badge variant={p.is_active ? "secondary" : "outline"}>
                  {p.is_active ? "Activo" : "Inactivo"}
                </Badge>
                <ProfessionalDialog
                  professional={p}
                  defaultPractitionerType={(clinic?.primary_practitioner_type as PractitionerType) ?? null}
                />
                <form action={deleteProfessional.bind(null, p.id)}>
                  <Button type="submit" variant="ghost" size="icon" aria-label="Eliminar">
                    <Trash2 className="size-4" />
                  </Button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

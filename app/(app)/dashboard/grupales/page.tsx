import Link from "next/link";
import { CalendarRange } from "lucide-react";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { getClinicEntitlements, planAtLeast, hasModule } from "@/lib/modules";
import { ModuleLocked } from "@/components/patterns/module-locked";
import { GroupSessionDialog } from "./group-session-dialog";

const STATUS_LABELS = { scheduled: "Programado", completed: "Realizado", cancelled: "Cancelado" } as const;

export default async function GrupalesPage() {
  const profile = await requireRole(["clinic_owner", "assistant", "receptionist", "professional"]);
  const supabase = await createClient();

  const entitlements = await getClinicEntitlements(profile.clinicId!);
  if (!planAtLeast(entitlements, "profesional") || !hasModule(entitlements, "group_workshops")) {
    return (
      <ModuleLocked
        title="Las sesiones grupales son un módulo adicional."
        requiredPlan="profesional"
        moduleLabel="Talleres grupales"
      />
    );
  }

  const [{ data: sessions }, { data: professionals }, { data: services }, { data: locations }, { data: attendeeCounts }] =
    await Promise.all([
      supabase
        .from("group_sessions")
        .select("*")
        .eq("clinic_id", profile.clinicId!)
        .order("starts_at", { ascending: false }),
      supabase.from("professionals").select("*").eq("clinic_id", profile.clinicId!).is("deleted_at", null),
      supabase.from("services").select("*").eq("clinic_id", profile.clinicId!).is("deleted_at", null),
      supabase.from("clinic_locations").select("*").eq("clinic_id", profile.clinicId!).is("deleted_at", null),
      supabase.from("group_session_attendees").select("group_session_id").eq("clinic_id", profile.clinicId!),
    ]);

  const professionalById = new Map((professionals ?? []).map((p) => [p.id, p]));
  const attendeeCountBySession = new Map<string, number>();
  for (const a of attendeeCounts ?? []) {
    attendeeCountBySession.set(a.group_session_id, (attendeeCountBySession.get(a.group_session_id) ?? 0) + 1);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Sesiones grupales y talleres</h1>
          <p className="mt-1 text-muted-foreground">
            Talleres, círculos, clases grupales y jornadas de bienestar con cupos e inscritos.
          </p>
        </div>
        <GroupSessionDialog professionals={professionals ?? []} services={services ?? []} locations={locations ?? []} />
      </div>

      {!sessions || sessions.length === 0 ? (
        <div className="rounded-2xl border border-dashed p-10 text-center">
          <CalendarRange className="mx-auto size-8 text-muted-foreground" />
          <p className="mt-3 font-medium">Aún no tienes talleres programados.</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Crea un taller para vender cupos y gestionar inscritos en un solo lugar.
          </p>
        </div>
      ) : (
        <ul className="divide-y rounded-xl border">
          {sessions.map((s) => {
            const attendees = attendeeCountBySession.get(s.id) ?? 0;
            return (
              <li key={s.id}>
                <Link
                  href={`/dashboard/grupales/${s.id}`}
                  className="flex items-center justify-between gap-4 px-4 py-3 hover:bg-muted/50"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-medium">{s.name}</p>
                      <Badge variant={s.status === "scheduled" ? "default" : "outline"}>{STATUS_LABELS[s.status]}</Badge>
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {new Date(s.starts_at).toLocaleString("es-CO")}
                      {s.professional_id ? ` · ${professionalById.get(s.professional_id)?.full_name}` : ""} ·{" "}
                      {attendees}/{s.max_capacity} inscritos
                    </p>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

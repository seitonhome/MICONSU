import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Users } from "lucide-react";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getClinicEntitlements, planAtLeast, hasModule } from "@/lib/modules";
import { ModuleLocked } from "@/components/patterns/module-locked";
import { AttendeeDialog } from "./attendee-dialog";
import { AttendeeRow } from "./attendee-row";
import { GroupSessionStatusActions } from "./status-actions";

const STATUS_LABELS = { scheduled: "Programado", completed: "Realizado", cancelled: "Cancelado" } as const;

export default async function GroupSessionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
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

  const { data: session } = await supabase
    .from("group_sessions")
    .select("*")
    .eq("id", id)
    .eq("clinic_id", profile.clinicId!)
    .single();

  if (!session) notFound();

  const [{ data: attendees }, { data: patients }] = await Promise.all([
    supabase.from("group_session_attendees").select("*").eq("group_session_id", id).order("created_at"),
    supabase.from("patients").select("*").eq("clinic_id", profile.clinicId!).order("full_name"),
  ]);

  const patientById = new Map((patients ?? []).map((p) => [p.id, p]));
  const enrolledIds = new Set((attendees ?? []).map((a) => a.patient_id));
  const availablePatients = (patients ?? []).filter((p) => !enrolledIds.has(p.id));
  const spotsLeft = session.max_capacity - (attendees?.length ?? 0);

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" render={<Link href="/dashboard/grupales" />}>
        <ArrowLeft className="size-4" /> Sesiones grupales
      </Button>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold">{session.name}</h1>
            <Badge variant={session.status === "scheduled" ? "default" : "outline"}>{STATUS_LABELS[session.status]}</Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {new Date(session.starts_at).toLocaleString("es-CO")} · {spotsLeft > 0 ? `${spotsLeft} cupos libres` : "Cupo lleno"}
          </p>
        </div>
        <GroupSessionStatusActions id={id} status={session.status} />
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium text-muted-foreground">
          Inscritos ({attendees?.length ?? 0}/{session.max_capacity})
        </h2>
        {session.status === "scheduled" && spotsLeft > 0 && availablePatients.length > 0 && (
          <AttendeeDialog groupSessionId={id} patients={availablePatients} />
        )}
      </div>

      {!attendees || attendees.length === 0 ? (
        <div className="rounded-2xl border border-dashed p-10 text-center">
          <Users className="mx-auto size-8 text-muted-foreground" />
          <p className="mt-3 font-medium">Nadie se ha inscrito todavía.</p>
        </div>
      ) : (
        <ul className="divide-y rounded-xl border">
          {attendees.map((a) => (
            <AttendeeRow
              key={a.id}
              groupSessionId={id}
              attendee={a}
              patientName={patientById.get(a.patient_id)?.full_name ?? "Paciente"}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

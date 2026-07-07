import Link from "next/link";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";

function startOfWeek(d: Date) {
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(d.getFullYear(), d.getMonth(), d.getDate() + diff);
  return monday;
}

export default async function OportunidadesPage() {
  const profile = await requireRole(["clinic_owner"]);
  const supabase = await createClient();
  const clinicId = profile.clinicId!;
  const now = new Date();
  const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
  const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [
    { data: activePatients },
    { data: futureAppointments },
    { data: recentCancellations },
    { data: recentAppointments },
    { data: pendingIntents },
    { data: professionals },
    { data: availabilityRules },
    { data: weekAppointments },
  ] = await Promise.all([
    supabase.from("patients").select("id, full_name, created_at").eq("clinic_id", clinicId).eq("status", "active").is("deleted_at", null),
    supabase
      .from("appointments")
      .select("patient_id, starts_at")
      .eq("clinic_id", clinicId)
      .gte("starts_at", now.toISOString())
      .not("status", "in", "(cancelled,expired,no_show)"),
    supabase
      .from("appointments")
      .select("id, patient_id, starts_at, service_id")
      .eq("clinic_id", clinicId)
      .eq("status", "cancelled")
      .gte("starts_at", thirtyDaysAgo.toISOString())
      .order("starts_at", { ascending: false }),
    supabase
      .from("appointments")
      .select("patient_id, service_id, status, starts_at, ends_at, professional_id")
      .eq("clinic_id", clinicId)
      .gte("starts_at", ninetyDaysAgo.toISOString()),
    supabase
      .from("payment_intents")
      .select("id, amount")
      .eq("clinic_id", clinicId)
      .in("status", ["pending", "pending_confirmation", "manual_review"]),
    supabase.from("professionals").select("id, full_name").eq("clinic_id", clinicId).eq("is_active", true),
    supabase.from("availability_rules").select("*").eq("clinic_id", clinicId).is("deleted_at", null),
    supabase
      .from("appointments")
      .select("starts_at, ends_at, professional_id")
      .eq("clinic_id", clinicId)
      .gte("starts_at", startOfWeek(now).toISOString())
      .not("status", "in", "(cancelled,expired,no_show)"),
  ]);

  const patientIdsWithFuture = new Set((futureAppointments ?? []).map((a) => a.patient_id));
  const patientsWithoutNext = (activePatients ?? []).filter((p) => !patientIdsWithFuture.has(p.id));

  const patientNameById = new Map((activePatients ?? []).map((p) => [p.id, p.full_name]));

  const completedByPatient = new Map<string, number>();
  const lastAppointmentByPatient = new Map<string, string>();
  for (const a of recentAppointments ?? []) {
    if (a.status === "completed") {
      completedByPatient.set(a.patient_id, (completedByPatient.get(a.patient_id) ?? 0) + 1);
    }
    const prev = lastAppointmentByPatient.get(a.patient_id);
    if (!prev || a.starts_at > prev) lastAppointmentByPatient.set(a.patient_id, a.starts_at);
  }
  const frequentPatients = Array.from(completedByPatient.entries())
    .filter(([, count]) => count >= 3)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);

  const inactivePatients = (activePatients ?? []).filter((p) => {
    const last = lastAppointmentByPatient.get(p.id);
    if (last) return new Date(last) < sixtyDaysAgo;
    return new Date(p.created_at) < thirtyDaysAgo && !patientIdsWithFuture.has(p.id);
  });

  const serviceCounts = new Map<string, number>();
  for (const a of recentAppointments ?? []) {
    if (a.service_id) serviceCounts.set(a.service_id, (serviceCounts.get(a.service_id) ?? 0) + 1);
  }
  const serviceIds = Array.from(serviceCounts.keys());
  const { data: services } = serviceIds.length > 0
    ? await supabase.from("services").select("id, name").in("id", serviceIds)
    : { data: [] as { id: string; name: string }[] };
  const topServices = Array.from(serviceCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([id, count]) => ({ name: services?.find((s) => s.id === id)?.name ?? "Servicio", count }));

  const pendingAmount = (pendingIntents ?? []).reduce((sum, i) => sum + Number(i.amount), 0);

  const weekStart = startOfWeek(now);
  const weekDays = Array.from({ length: 7 }, (_, i) => (weekStart.getDay() + i) % 7);
  let totalAvailableMinutes = 0;
  for (const prof of professionals ?? []) {
    const rules = (availabilityRules ?? []).filter((r) => r.professional_id === prof.id);
    for (const day of weekDays) {
      for (const rule of rules.filter((r) => r.day_of_week === day)) {
        const [sh, sm] = rule.start_time.split(":").map(Number);
        const [eh, em] = rule.end_time.split(":").map(Number);
        totalAvailableMinutes += eh * 60 + em - (sh * 60 + sm);
      }
    }
  }
  let bookedMinutes = 0;
  for (const a of weekAppointments ?? []) {
    bookedMinutes += (new Date(a.ends_at).getTime() - new Date(a.starts_at).getTime()) / 60000;
  }
  const freeHoursThisWeek = Math.max(0, Math.round((totalAvailableMinutes - bookedMinutes) / 60));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Panel de oportunidad comercial</h1>
        <p className="mt-1 text-muted-foreground">
          Ideas concretas para llenar tu agenda y recuperar ingresos que podrías estar dejando pasar.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <OpportunityCard
          title={`${patientsWithoutNext.length} pacientes sin próxima cita`}
          description="Podrían estar listos para agendar un control o seguimiento."
        >
          {patientsWithoutNext.slice(0, 6).map((p) => (
            <li key={p.id}>{p.full_name}</li>
          ))}
        </OpportunityCard>

        <OpportunityCard
          title={`Puedes recuperar ${recentCancellations?.length ?? 0} espacios cancelados`}
          description="Usa la lista de espera para llenar estos horarios."
          href="/dashboard/lista-espera"
        >
          {(recentCancellations ?? []).slice(0, 6).map((a) => (
            <li key={a.id}>
              {patientNameById.get(a.patient_id) ?? "Paciente"} · {new Date(a.starts_at).toLocaleDateString("es-CO")}
            </li>
          ))}
        </OpportunityCard>

        <OpportunityCard
          title={`$${pendingAmount.toLocaleString("es-CO")} pendientes por confirmar`}
          description="Revisa la conciliación de pagos para cerrar estos ingresos."
          href="/dashboard/pagos/conciliacion"
        />

        <OpportunityCard
          title={`${freeHoursThisWeek} horas libres esta semana`}
          description="Comparte tu link de reservas para llenar estos espacios."
        />

        <OpportunityCard title="Servicios con mayor demanda" description="Últimos 90 días.">
          {topServices.map((s) => (
            <li key={s.name} className="flex items-center justify-between">
              {s.name} <Badge variant="outline">{s.count}</Badge>
            </li>
          ))}
        </OpportunityCard>

        <OpportunityCard
          title={`${frequentPatients.length} pacientes frecuentes`}
          description="Considera ofrecerles un paquete o beneficio de fidelidad."
        >
          {frequentPatients.map(([id, count]) => (
            <li key={id} className="flex items-center justify-between">
              {patientNameById.get(id) ?? "Paciente"} <Badge variant="outline">{count} sesiones</Badge>
            </li>
          ))}
        </OpportunityCard>

        <OpportunityCard
          title={`${inactivePatients.length} pacientes inactivos`}
          description="No han vuelto en más de 60 días. Un mensaje de seguimiento podría traerlos de vuelta."
        >
          {inactivePatients.slice(0, 6).map((p) => (
            <li key={p.id}>{p.full_name}</li>
          ))}
        </OpportunityCard>
      </div>
    </div>
  );
}

function OpportunityCard({
  title,
  description,
  href,
  children,
}: {
  title: string;
  description: string;
  href?: string;
  children?: React.ReactNode;
}) {
  const content = (
    <div className="h-full rounded-xl border p-4 transition-colors hover:border-primary">
      <p className="font-medium">{title}</p>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      {children && <ul className="mt-3 space-y-1 text-sm text-muted-foreground">{children}</ul>}
    </div>
  );
  return href ? <Link href={href}>{content}</Link> : content;
}

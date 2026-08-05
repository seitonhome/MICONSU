import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { SUPPORT_TICKET_STATUS_LABELS, SUPPORT_TICKET_PRIORITY_LABELS } from "@/lib/domain/labels";
import { evaluateSla, averageHours, formatHours, SLA_TARGETS } from "@/lib/domain/sla";
import type { Database } from "@/lib/supabase/types";

const OPEN_STATUSES = ["open", "in_review", "waiting_client", "in_progress"] as const;
const CLOSED_STATUSES = ["resolved", "closed"] as const;

export default async function AdminSoportePage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const supabase = await createClient();
  const { status } = await searchParams;

  const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();

  const [{ data: recentTickets }, { data: backupLogs }] = await Promise.all([
    supabase
      .from("support_tickets")
      .select("priority, status, created_at, first_response_at, resolved_at")
      .gte("created_at", ninetyDaysAgo),
    supabase
      .from("backup_logs")
      .select("*")
      .is("clinic_id", null)
      .order("started_at", { ascending: false })
      .limit(1),
  ]);

  const tickets90d = recentTickets ?? [];
  const openCount = tickets90d.filter((t) => OPEN_STATUSES.includes(t.status as (typeof OPEN_STATUSES)[number])).length;
  const closedCount = tickets90d.filter((t) => CLOSED_STATUSES.includes(t.status as (typeof CLOSED_STATUSES)[number])).length;
  const criticalOpenCount = tickets90d.filter(
    (t) => t.priority === "critical" && OPEN_STATUSES.includes(t.status as (typeof OPEN_STATUSES)[number]),
  ).length;

  const responded = tickets90d.filter((t) => t.first_response_at);
  const avgFirstResponse = averageHours(
    responded.map((t) => (new Date(t.first_response_at!).getTime() - new Date(t.created_at).getTime()) / 3_600_000),
  );
  const onTimeResponded = responded.filter((t) => !evaluateSla(t).firstResponseBreached).length;
  const slaCompliancePct = responded.length > 0 ? Math.round((onTimeResponded / responded.length) * 100) : null;

  const resolvedTickets = tickets90d.filter((t) => t.resolved_at);
  const avgResolution = averageHours(
    resolvedTickets.map((t) => (new Date(t.resolved_at!).getTime() - new Date(t.created_at).getTime()) / 3_600_000),
  );

  const lastBackup = backupLogs?.[0] ?? null;

  const query = supabase.from("support_tickets").select("*").order("priority").order("created_at", { ascending: false });
  const { data: tickets } = status
    ? await query.eq("status", status as Database["public"]["Enums"]["support_ticket_status"])
    : await query.in("status", [...OPEN_STATUSES]);

  const clinicIds = Array.from(new Set((tickets ?? []).map((t) => t.clinic_id)));
  const { data: clinics } = clinicIds.length > 0
    ? await supabase.from("clinics").select("id, commercial_name").in("id", clinicIds)
    : { data: [] as { id: string; commercial_name: string }[] };
  const clinicNameById = new Map((clinics ?? []).map((c) => [c.id, c.commercial_name]));

  const metrics = [
    { title: `${openCount} tickets abiertos`, subtitle: "últimos 90 días" },
    { title: `${closedCount} tickets cerrados`, subtitle: "últimos 90 días" },
    { title: formatHours(avgFirstResponse), subtitle: "tiempo promedio de primera respuesta" },
    { title: formatHours(avgResolution), subtitle: "tiempo promedio de resolución" },
    {
      title: slaCompliancePct !== null ? `${slaCompliancePct}%` : "—",
      subtitle: `cumplimiento de SLA de primera respuesta (${responded.length} evaluados)`,
    },
    { title: `${criticalOpenCount} incidentes críticos abiertos`, subtitle: "prioridad crítica" },
    {
      title: lastBackup ? new Date(lastBackup.started_at).toLocaleDateString("es-CO") : "Sin registros",
      subtitle: lastBackup ? `último backup de plataforma (${lastBackup.status})` : "backups de plataforma",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Soporte — todos los consultorios</h1>
        <p className="mt-1 text-muted-foreground">Tickets del Plan Continuidad Clínica de toda la plataforma.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map((m) => (
          <Card key={m.subtitle}>
            <CardHeader>
              <CardTitle className="text-xl">{m.title}</CardTitle>
              <CardDescription>{m.subtitle}</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </div>

      <p className="text-xs text-muted-foreground">
        Objetivos de SLA: crítica {SLA_TARGETS.critical.firstResponseHours}h respuesta / {SLA_TARGETS.critical.resolutionHours}h
        resolución · alta {SLA_TARGETS.high.firstResponseHours}h / {SLA_TARGETS.high.resolutionHours}h · media{" "}
        {SLA_TARGETS.medium.firstResponseHours}h / {SLA_TARGETS.medium.resolutionHours}h · baja {SLA_TARGETS.low.firstResponseHours}h
        / evaluación en roadmap.
      </p>

      {!tickets || tickets.length === 0 ? (
        <p className="text-sm text-muted-foreground">No hay tickets en este filtro.</p>
      ) : (
        <ul className="divide-y rounded-xl border bg-background">
          {tickets.map((t) => {
            const sla = evaluateSla(t);
            const breached = sla.firstResponseBreached || sla.resolutionBreached;
            return (
              <li key={t.id}>
                <Link href={`/admin/soporte/${t.id}`} className="flex items-center justify-between gap-4 px-4 py-3 hover:bg-muted/50">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{t.subject}</p>
                    <p className="text-xs text-muted-foreground">
                      {clinicNameById.get(t.clinic_id) ?? "Consultorio"} · {SUPPORT_TICKET_PRIORITY_LABELS[t.priority]}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {breached && <Badge variant="destructive">SLA vencido</Badge>}
                    <Badge variant="outline">{SUPPORT_TICKET_STATUS_LABELS[t.status]}</Badge>
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

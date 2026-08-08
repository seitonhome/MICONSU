import Link from "next/link";
import {
  CalendarDays,
  Wallet,
  UserPlus,
  CalendarX,
  UserX,
  LifeBuoy,
  ShieldCheck,
  Lightbulb,
  BarChart3,
  ListChecks,
} from "lucide-react";
import { requireCurrentProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ActivationChecklist } from "@/components/patterns/activation-checklist";
import { getOnboardingContext, computeStepCompletion, progressPercent } from "@/app/onboarding/_lib/context";
import { bogotaStartOfDay, bogotaStartOfMonth } from "@/lib/utils/timezone";
import { cn } from "@/lib/utils";

// Alturas decorativas de la mini-gráfica de ingresos — no representan el
// desglose diario real (eso vive en Reportes), solo dan una sensación de
// tendencia junto al monto total del mes.
const REVENUE_SPARKLINE_HEIGHTS = [38, 52, 44, 68, 60, 100];
const AGENDA_DOT_COLORS = ["bg-primary", "bg-accent", "bg-chart-3"];

export default async function DashboardPage() {
  const profile = await requireCurrentProfile();
  const firstName = profile.fullName.split(" ")[0] || "de nuevo";

  if (!profile.clinicId) {
    return (
      <div>
        <h1 className="text-2xl font-semibold">Hola, {firstName}</h1>
      </div>
    );
  }

  const supabase = await createClient();
  const clinicId = profile.clinicId;

  const activation =
    profile.role === "clinic_owner"
      ? (async () => {
          const ctx = await getOnboardingContext();
          const completion = computeStepCompletion(ctx);
          return { completion, percent: progressPercent(completion) };
        })()
      : Promise.resolve(null);

  const now = new Date();
  const todayStart = bogotaStartOfDay(now);
  const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);
  const monthStart = bogotaStartOfMonth(now);
  const prevMonthAnchor = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const prevMonthStart = bogotaStartOfMonth(prevMonthAnchor);

  const [
    { count: todayCount },
    { data: todayAppointments },
    { data: nextAppointment },
    { data: monthPayments },
    { data: prevMonthPayments },
    { count: pendingPaymentsCount },
    { count: newPatientsCount },
    { count: cancelledCount },
    { count: noShowCount },
    { count: openTicketsCount },
    { data: lastBackup },
    { count: waitlistCount },
  ] = await Promise.all([
    supabase
      .from("appointments")
      .select("id", { count: "exact", head: true })
      .eq("clinic_id", clinicId)
      .is("deleted_at", null)
      .gte("starts_at", todayStart.toISOString())
      .lt("starts_at", todayEnd.toISOString())
      .not("status", "in", "(cancelled,expired)"),
    supabase
      .from("appointments")
      .select("id, starts_at, service_id")
      .eq("clinic_id", clinicId)
      .is("deleted_at", null)
      .gte("starts_at", todayStart.toISOString())
      .lt("starts_at", todayEnd.toISOString())
      .not("status", "in", "(cancelled,expired)")
      .order("starts_at")
      .limit(3),
    supabase
      .from("appointments")
      .select("*")
      .eq("clinic_id", clinicId)
      .is("deleted_at", null)
      .gte("starts_at", now.toISOString())
      .not("status", "in", "(cancelled,expired,no_show,completed)")
      .order("starts_at")
      .limit(1)
      .maybeSingle(),
    supabase
      .from("payments")
      .select("amount")
      .eq("clinic_id", clinicId)
      .eq("status", "approved")
      .gte("paid_at", monthStart.toISOString()),
    supabase
      .from("payments")
      .select("amount")
      .eq("clinic_id", clinicId)
      .eq("status", "approved")
      .gte("paid_at", prevMonthStart.toISOString())
      .lt("paid_at", monthStart.toISOString()),
    supabase
      .from("payment_intents")
      .select("id", { count: "exact", head: true })
      .eq("clinic_id", clinicId)
      .in("status", ["pending", "pending_confirmation", "manual_review"]),
    supabase
      .from("patients")
      .select("id", { count: "exact", head: true })
      .eq("clinic_id", clinicId)
      .is("deleted_at", null)
      .gte("created_at", monthStart.toISOString()),
    supabase
      .from("appointments")
      .select("id", { count: "exact", head: true })
      .eq("clinic_id", clinicId)
      .eq("status", "cancelled")
      .gte("starts_at", monthStart.toISOString()),
    supabase
      .from("appointments")
      .select("id", { count: "exact", head: true })
      .eq("clinic_id", clinicId)
      .eq("status", "no_show")
      .gte("starts_at", monthStart.toISOString()),
    supabase
      .from("support_tickets")
      .select("id", { count: "exact", head: true })
      .eq("clinic_id", clinicId)
      .in("status", ["open", "in_review", "waiting_client", "in_progress"]),
    supabase
      .from("backup_logs")
      .select("*")
      .or(`clinic_id.eq.${clinicId},clinic_id.is.null`)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("waitlist_entries")
      .select("id", { count: "exact", head: true })
      .eq("clinic_id", clinicId)
      .eq("status", "waiting"),
  ]);

  const todayServiceIds = Array.from(new Set((todayAppointments ?? []).map((a) => a.service_id)));
  const { data: todayServices } =
    todayServiceIds.length > 0
      ? await supabase.from("services").select("id, name").in("id", todayServiceIds)
      : { data: [] as { id: string; name: string }[] };
  const serviceNameById = new Map((todayServices ?? []).map((s) => [s.id, s.name]));

  const activationState = await activation;
  const monthRevenue = (monthPayments ?? []).reduce((sum, p) => sum + Number(p.amount), 0);
  const prevMonthRevenue = (prevMonthPayments ?? []).reduce((sum, p) => sum + Number(p.amount), 0);
  const revenueChangePct = prevMonthRevenue > 0 ? Math.round(((monthRevenue - prevMonthRevenue) / prevMonthRevenue) * 100) : null;

  const todayLabel = now.toLocaleDateString("es-CO", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "America/Bogota",
  });

  const compactStats = [
    {
      icon: ListChecks,
      value: waitlistCount ?? 0,
      label: "en lista de espera",
      href: "/dashboard/lista-espera",
    },
    {
      icon: CalendarX,
      value: cancelledCount ?? 0,
      label: "citas canceladas este mes",
      href: "/dashboard/lista-espera",
    },
    {
      icon: UserX,
      value: noShowCount ?? 0,
      label: "inasistencias este mes",
      href: "/dashboard/servicios",
    },
    {
      icon: LifeBuoy,
      value: openTicketsCount ?? 0,
      label: "tickets de soporte abiertos",
      href: "/dashboard/soporte",
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-5">
        <div>
          <p className="text-[12.5px] font-semibold text-muted-foreground capitalize">{todayLabel}</p>
          <h1 className="mt-1.5 text-[28px] font-extrabold tracking-tight text-foreground">Hola, {firstName}</h1>
          <p className="mt-1.5 text-[14.5px] text-muted-foreground">Este es el estado de tu consultorio hoy.</p>
        </div>
        <div className="flex gap-2.5">
          <Button variant="outline" className="rounded-[10px]" render={<Link href="/dashboard/oportunidades" />}>
            <Lightbulb className="size-4" />
            Oportunidades
          </Button>
          <Button variant="outline" className="rounded-[10px]" render={<Link href="/dashboard/reportes" />}>
            <BarChart3 className="size-4" />
            Reportes
          </Button>
        </div>
      </div>

      {activationState && <ActivationChecklist completion={activationState.completion} percent={activationState.percent} />}

      {/* Bento fila 1: agenda / ingresos / pacientes nuevos */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-12">
        <Card className="rounded-[20px] border-black/[0.06] p-6 shadow-[0_1px_2px_rgba(20,40,60,0.04),0_10px_28px_-16px_rgba(20,40,60,0.16)] md:col-span-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex size-[38px] shrink-0 items-center justify-center rounded-[11px] bg-secondary">
                <CalendarDays className="size-[19px] text-primary" strokeWidth={1.7} />
              </div>
              <p className="text-sm font-semibold text-foreground/90">Agenda de hoy</p>
            </div>
            <Link href="/dashboard/agenda" className="text-[12.5px] font-semibold text-primary hover:underline">
              Ver agenda →
            </Link>
          </div>

          <div className="mt-4.5">
            <p className="text-[38px] leading-none font-extrabold text-foreground">
              {todayCount ?? 0} <span className="text-base font-semibold text-muted-foreground">citas hoy</span>
            </p>
            <p className="mt-2 text-[13.5px] text-muted-foreground">
              {nextAppointment ? (
                <>
                  Tu próxima cita es a las{" "}
                  <strong className="font-semibold text-foreground/90">
                    {new Date(nextAppointment.starts_at).toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" })}
                  </strong>
                  .
                </>
              ) : (
                "No tienes más citas programadas por ahora."
              )}
            </p>
          </div>

          {todayAppointments && todayAppointments.length > 0 && (
            <div className="mt-1 flex flex-col gap-2.5 border-t border-black/[0.06] pt-3">
              {todayAppointments.map((a, i) => (
                <div key={a.id} className="flex items-center gap-3">
                  <span className={cn("size-1.5 shrink-0 rounded-full", AGENDA_DOT_COLORS[i % AGENDA_DOT_COLORS.length])} />
                  <span className="w-14 text-[13px] font-semibold text-foreground/90">
                    {new Date(a.starts_at).toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" })}
                  </span>
                  <span className="truncate text-[13px] text-muted-foreground">{serviceNameById.get(a.service_id) ?? "Servicio"}</span>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="rounded-[20px] border-black/[0.06] p-6 shadow-[0_1px_2px_rgba(20,40,60,0.04),0_10px_28px_-16px_rgba(20,40,60,0.16)] md:col-span-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex size-[38px] shrink-0 items-center justify-center rounded-[11px] bg-secondary">
                <Wallet className="size-[19px] text-primary" strokeWidth={1.7} />
              </div>
              <p className="text-sm font-semibold text-foreground/90">Ingresos del mes</p>
            </div>
            {revenueChangePct !== null && (
              <Badge
                variant="secondary"
                className="rounded-full border-transparent bg-accent/[0.28] px-2.5 py-0.5 text-[11.5px] font-bold text-accent-foreground"
              >
                {revenueChangePct >= 0 ? "+" : ""}
                {revenueChangePct}%
              </Badge>
            )}
          </div>

          <p className="mt-4 text-[30px] font-extrabold tracking-tight text-foreground">
            ${monthRevenue.toLocaleString("es-CO")}
          </p>

          <div className="mt-4 flex h-14 items-end gap-2">
            {REVENUE_SPARKLINE_HEIGHTS.map((h, i) => (
              <div
                key={i}
                className={cn("flex-1 rounded-t-[5px]", i === REVENUE_SPARKLINE_HEIGHTS.length - 1 ? "bg-primary" : "bg-chart-4")}
                style={{ height: `${h}%` }}
              />
            ))}
          </div>

          <p className="mt-4 text-[12.5px] text-muted-foreground">
            {pendingPaymentsCount && pendingPaymentsCount > 0 ? (
              <>
                <Link href="/dashboard/pagos/conciliacion" className="font-semibold text-primary hover:underline">
                  {pendingPaymentsCount} pagos
                </Link>{" "}
                pendientes por confirmar
              </>
            ) : (
              "No tienes pagos pendientes por confirmar."
            )}
          </p>
        </Card>

        <Link href="/dashboard/pacientes" className="md:col-span-3">
          <Card className="h-full justify-between rounded-[20px] border-black/[0.06] p-[22px] shadow-[0_1px_2px_rgba(20,40,60,0.04),0_10px_28px_-16px_rgba(20,40,60,0.16)] transition-shadow hover:shadow-[0_1px_2px_rgba(20,40,60,0.06),0_14px_32px_-16px_rgba(20,40,60,0.22)]">
            <div className="flex size-[38px] items-center justify-center rounded-[11px] bg-accent/[0.22]">
              <UserPlus className="size-[19px] text-accent-foreground" strokeWidth={1.7} />
            </div>
            <div className="mt-3.5">
              <p className="text-[30px] font-extrabold text-foreground">{newPatientsCount ?? 0}</p>
              <p className="mt-1 text-[13px] text-muted-foreground">pacientes nuevos este mes</p>
            </div>
          </Card>
        </Link>
      </div>

      {/* Bento fila 2: franja compacta */}
      <div className="flex flex-wrap gap-4">
        {compactStats.map((stat) => (
          <Link key={stat.label} href={stat.href} className="min-w-[190px] flex-1">
            <Card className="h-full gap-2.5 rounded-[16px] border-black/[0.06] p-[18px] shadow-none transition-colors hover:border-primary/30">
              <stat.icon className="size-[18px] text-primary" strokeWidth={1.6} />
              <p className="text-[22px] font-extrabold text-foreground">{stat.value}</p>
              <p className="text-[12.5px] text-muted-foreground">{stat.label}</p>
            </Card>
          </Link>
        ))}

        <Link href="/dashboard/soporte" className="min-w-[230px] flex-[1.4]">
          <Card className="h-full flex-row items-center gap-3.5 rounded-[16px] border-black/[0.06] p-[18px] shadow-none transition-colors hover:border-primary/30">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-[10px] bg-accent/[0.22]">
              <ShieldCheck className="size-[18px] text-accent-foreground" strokeWidth={1.6} />
            </div>
            <div className="min-w-0">
              <p className="truncate text-[13.5px] font-semibold text-foreground/90">
                {lastBackup ? "Último respaldo correcto" : "Aún no hay backups registrados"}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {lastBackup
                  ? `${new Date(lastBackup.created_at).toLocaleDateString("es-CO")} · ${lastBackup.backup_type}`
                  : "Se respaldan automáticamente una vez esté activa tu licencia."}
              </p>
            </div>
          </Card>
        </Link>
      </div>
    </div>
  );
}

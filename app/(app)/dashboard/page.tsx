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
} from "lucide-react";
import { requireCurrentProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}
function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

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

  const now = new Date();
  const todayStart = startOfDay(now);
  const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);
  const monthStart = startOfMonth(now);

  const [
    { count: todayCount },
    { data: nextAppointment },
    { data: monthPayments },
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

  const monthRevenue = (monthPayments ?? []).reduce((sum, p) => sum + Number(p.amount), 0);

  const cards = [
    {
      icon: CalendarDays,
      title: `Hoy tienes ${todayCount ?? 0} citas`,
      description: nextAppointment
        ? `Tu próxima cita es a las ${new Date(nextAppointment.starts_at).toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" })}.`
        : "No tienes más citas programadas por ahora.",
      href: "/dashboard/agenda",
    },
    {
      icon: Wallet,
      title: `$${monthRevenue.toLocaleString("es-CO")} en pagos confirmados este mes`,
      description:
        pendingPaymentsCount && pendingPaymentsCount > 0
          ? `${pendingPaymentsCount} pagos están pendientes por confirmar.`
          : "No tienes pagos pendientes por confirmar.",
      href: "/dashboard/pagos/conciliacion",
    },
    {
      icon: UserPlus,
      title: `${newPatientsCount ?? 0} pacientes nuevos este mes`,
      description: "Se registraron automáticamente al reservar o los agregaste manualmente.",
      href: "/dashboard/pacientes",
    },
    {
      icon: CalendarX,
      title: `${cancelledCount ?? 0} citas canceladas este mes`,
      description:
        waitlistCount && waitlistCount > 0
          ? `Tienes ${waitlistCount} pacientes en lista de espera que podrían tomar esos espacios.`
          : "Activa la lista de espera para recuperar espacios cancelados.",
      href: "/dashboard/lista-espera",
    },
    {
      icon: UserX,
      title: `${noShowCount ?? 0} inasistencias este mes`,
      description: "Considera pedir anticipos para servicios con más inasistencias.",
      href: "/dashboard/servicios",
    },
    {
      icon: LifeBuoy,
      title: `${openTicketsCount ?? 0} tickets de soporte abiertos`,
      description: "Tu Plan Continuidad Clínica incluye soporte prioritario según tu plan.",
      href: "/dashboard/soporte",
    },
    {
      icon: ShieldCheck,
      title: lastBackup ? "Tu último backup fue realizado correctamente" : "Aún no hay backups registrados",
      description: lastBackup
        ? `${new Date(lastBackup.created_at).toLocaleDateString("es-CO")} · ${lastBackup.backup_type}`
        : "Tus datos se respaldan automáticamente una vez esté activa tu licencia.",
      href: "/dashboard/soporte",
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Hola, {firstName}</h1>
          <p className="mt-1 text-muted-foreground">Este es el estado de tu consultorio hoy.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" render={<Link href="/dashboard/oportunidades" />}>
            <Lightbulb className="size-4" />
            Oportunidades
          </Button>
          <Button variant="outline" render={<Link href="/dashboard/reportes" />}>
            <BarChart3 className="size-4" />
            Reportes
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => (
          <Link key={card.title} href={card.href}>
            <Card className="h-full transition-colors hover:border-primary">
              <CardHeader>
                <card.icon className="size-5 text-primary" />
                <CardTitle className="mt-2 text-base">{card.title}</CardTitle>
                <CardDescription>{card.description}</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}

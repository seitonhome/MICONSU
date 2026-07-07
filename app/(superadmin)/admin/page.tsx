import Link from "next/link";
import { Building2, LifeBuoy, ShieldCheck, Clock } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default async function SuperAdminHomePage() {
  const supabase = await createClient();

  const thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

  const [
    { count: clinicsCount },
    { count: activeLicensesCount },
    { count: openTicketsCount },
    { count: expiringSupportCount },
  ] = await Promise.all([
    supabase.from("clinics").select("id", { count: "exact", head: true }).is("deleted_at", null),
    supabase.from("licenses").select("id", { count: "exact", head: true }).eq("status", "active"),
    supabase
      .from("support_tickets")
      .select("id", { count: "exact", head: true })
      .in("status", ["open", "in_review", "waiting_client", "in_progress"]),
    supabase
      .from("support_subscriptions")
      .select("id", { count: "exact", head: true })
      .lte("ends_at", thirtyDaysFromNow)
      .eq("status", "active"),
  ]);

  const cards = [
    { icon: Building2, title: `${clinicsCount ?? 0} consultorios`, href: "/admin/consultorios" },
    { icon: ShieldCheck, title: `${activeLicensesCount ?? 0} licencias activas`, href: "/admin/consultorios" },
    { icon: LifeBuoy, title: `${openTicketsCount ?? 0} tickets abiertos`, href: "/admin/soporte" },
    { icon: Clock, title: `${expiringSupportCount ?? 0} soportes por vencer (30 días)`, href: "/admin/consultorios" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Resumen</h1>
        <p className="mt-1 text-muted-foreground">Estado general de todos los consultorios en Mi Consultorio Pro.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <Link key={c.title} href={c.href}>
            <Card className="h-full transition-colors hover:border-primary">
              <CardHeader>
                <c.icon className="size-5 text-primary" />
                <CardTitle className="mt-2 text-base">{c.title}</CardTitle>
                <CardDescription />
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}

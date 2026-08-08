import Link from "next/link";
import { DollarSign, TrendingUp, AlertTriangle, Ban } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// Plan único: $39 USD/año (ver HOTMART_LISTING.md, USER_MANUAL.md). No hay
// tabla de facturación propia — esto es una estimación a partir de licencias
// activas, no un reemplazo del reporte real de ventas en Hotmart.
const ANNUAL_PLAN_PRICE_USD = 39;

export default async function MetricasPage() {
  const supabase = await createClient();

  const now = new Date();
  const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();
  const sixMonthsAgo = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000).toISOString();

  const [{ data: licenses }, { data: expiringLicenses }, { data: recentLicenses }] = await Promise.all([
    supabase.from("licenses").select("status"),
    supabase
      .from("licenses")
      .select("id, clinic_id, status, ends_at, trial_ends_at")
      .eq("status", "active")
      .not("ends_at", "is", null)
      .lte("ends_at", thirtyDaysFromNow)
      .gte("ends_at", now.toISOString())
      .order("ends_at"),
    supabase
      .from("licenses")
      .select("id, purchased_at")
      .not("purchased_at", "is", null)
      .gte("purchased_at", sixMonthsAgo),
  ]);

  const clinicIds = Array.from(new Set((expiringLicenses ?? []).map((l) => l.clinic_id)));
  const { data: clinics } =
    clinicIds.length > 0
      ? await supabase.from("clinics").select("id, commercial_name").in("id", clinicIds)
      : { data: [] as { id: string; commercial_name: string }[] };
  const clinicNameById = new Map((clinics ?? []).map((c) => [c.id, c.commercial_name]));

  const byStatus = { active: 0, trial: 0, suspended: 0, expired: 0, cancelled: 0 };
  for (const l of licenses ?? []) {
    byStatus[l.status as keyof typeof byStatus] = (byStatus[l.status as keyof typeof byStatus] ?? 0) + 1;
  }
  const activeCount = byStatus.active;
  const arr = activeCount * ANNUAL_PLAN_PRICE_USD;

  const monthCounts = new Map<string, number>();
  for (const l of recentLicenses ?? []) {
    if (!l.purchased_at) continue;
    const key = new Date(l.purchased_at).toLocaleDateString("es-CO", { year: "numeric", month: "short" });
    monthCounts.set(key, (monthCounts.get(key) ?? 0) + 1);
  }

  const cards = [
    {
      icon: DollarSign,
      title: `$${arr.toLocaleString("en-US")} USD estimados/año`,
      description: `${activeCount} licencia${activeCount === 1 ? "" : "s"} activa${activeCount === 1 ? "" : "s"} × $${ANNUAL_PLAN_PRICE_USD} — estimación, no reemplaza el reporte de Hotmart.`,
    },
    {
      icon: TrendingUp,
      title: `${(recentLicenses ?? []).length} licencias nuevas`,
      description: "En los últimos 6 meses (por fecha de compra).",
    },
    {
      icon: AlertTriangle,
      title: `${expiringLicenses?.length ?? 0} licencias por vencer`,
      description: "En los próximos 30 días — sin renovación automática confirmada.",
    },
    {
      icon: Ban,
      title: `${byStatus.suspended + byStatus.expired + byStatus.cancelled} licencias inactivas`,
      description: `${byStatus.suspended} suspendidas · ${byStatus.expired} vencidas · ${byStatus.cancelled} canceladas.`,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Métricas de negocio</h1>
        <p className="mt-1 text-muted-foreground">
          Estimación a partir de las licencias registradas en la plataforma. Para el detalle real de ventas y cobros, consulta Hotmart.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <Card key={c.title}>
            <CardHeader>
              <c.icon className="size-5 text-primary" />
              <CardTitle className="mt-2 text-base">{c.title}</CardTitle>
              <CardDescription>{c.description}</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </div>

      {monthCounts.size > 0 && (
        <div>
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Licencias nuevas por mes
          </h2>
          <ul className="flex flex-wrap gap-2">
            {Array.from(monthCounts.entries()).map(([month, count]) => (
              <li key={month}>
                <Badge variant="outline">
                  {month}: {count}
                </Badge>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div>
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Licencias por vencer en 30 días
        </h2>
        {!expiringLicenses || expiringLicenses.length === 0 ? (
          <p className="text-sm text-muted-foreground">Ninguna licencia vence en los próximos 30 días.</p>
        ) : (
          <ul className="divide-y rounded-xl border bg-background">
            {expiringLicenses.map((l) => (
              <li key={l.id}>
                <Link
                  href={`/admin/consultorios/${l.clinic_id}`}
                  className="flex items-center justify-between gap-4 px-4 py-3 hover:bg-muted/50"
                >
                  <span className="text-sm font-medium">{clinicNameById.get(l.clinic_id) ?? "Consultorio"}</span>
                  <span className="text-xs text-muted-foreground">
                    Vence el {l.ends_at ? new Date(l.ends_at).toLocaleDateString("es-CO") : "—"}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

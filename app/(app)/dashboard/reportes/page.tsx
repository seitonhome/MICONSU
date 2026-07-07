import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { SimpleBarChart } from "@/components/patterns/simple-bar-chart";
import { ExportCsvButton } from "./export-csv-button";

const MONTHS_BACK = 6;

function monthKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}
function monthLabel(d: Date) {
  return d.toLocaleDateString("es-CO", { month: "short" });
}

export default async function ReportesPage() {
  const profile = await requireRole(["clinic_owner", "finance_user"]);
  const supabase = await createClient();
  const clinicId = profile.clinicId!;

  const now = new Date();
  const rangeStart = new Date(now.getFullYear(), now.getMonth() - (MONTHS_BACK - 1), 1);

  const [{ data: appointments }, { data: payments }, { data: patients }] = await Promise.all([
    supabase
      .from("appointments")
      .select("starts_at, status, service_id")
      .eq("clinic_id", clinicId)
      .gte("starts_at", rangeStart.toISOString()),
    supabase
      .from("payments")
      .select("amount, paid_at")
      .eq("clinic_id", clinicId)
      .eq("status", "approved")
      .gte("paid_at", rangeStart.toISOString()),
    supabase
      .from("patients")
      .select("id, created_at")
      .eq("clinic_id", clinicId)
      .is("deleted_at", null)
      .gte("created_at", rangeStart.toISOString()),
  ]);

  const months = Array.from({ length: MONTHS_BACK }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (MONTHS_BACK - 1) + i, 1);
    return { key: monthKey(d), label: monthLabel(d) };
  });

  const appointmentsByMonth = new Map(months.map((m) => [m.key, 0]));
  const cancelledByMonth = new Map(months.map((m) => [m.key, 0]));
  const noShowByMonth = new Map(months.map((m) => [m.key, 0]));
  for (const a of appointments ?? []) {
    const key = monthKey(new Date(a.starts_at));
    if (!appointmentsByMonth.has(key)) continue;
    appointmentsByMonth.set(key, (appointmentsByMonth.get(key) ?? 0) + 1);
    if (a.status === "cancelled") cancelledByMonth.set(key, (cancelledByMonth.get(key) ?? 0) + 1);
    if (a.status === "no_show") noShowByMonth.set(key, (noShowByMonth.get(key) ?? 0) + 1);
  }

  const revenueByMonth = new Map(months.map((m) => [m.key, 0]));
  for (const p of payments ?? []) {
    if (!p.paid_at) continue;
    const key = monthKey(new Date(p.paid_at));
    if (!revenueByMonth.has(key)) continue;
    revenueByMonth.set(key, (revenueByMonth.get(key) ?? 0) + Number(p.amount));
  }

  const newPatientsByMonth = new Map(months.map((m) => [m.key, 0]));
  for (const p of patients ?? []) {
    const key = monthKey(new Date(p.created_at));
    if (!newPatientsByMonth.has(key)) continue;
    newPatientsByMonth.set(key, (newPatientsByMonth.get(key) ?? 0) + 1);
  }

  const serviceCounts = new Map<string, number>();
  for (const a of appointments ?? []) {
    if (a.service_id) serviceCounts.set(a.service_id, (serviceCounts.get(a.service_id) ?? 0) + 1);
  }
  const serviceIds = Array.from(serviceCounts.keys());
  const { data: services } = serviceIds.length > 0
    ? await supabase.from("services").select("id, name").in("id", serviceIds)
    : { data: [] as { id: string; name: string }[] };
  const topServices = Array.from(serviceCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([id, count]) => ({ name: services?.find((s) => s.id === id)?.name ?? "Servicio", count }));

  const appointmentsData = months.map((m) => ({ label: m.label, value: appointmentsByMonth.get(m.key) ?? 0 }));
  const revenueData = months.map((m) => ({ label: m.label, value: revenueByMonth.get(m.key) ?? 0 }));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Reportes</h1>
        <p className="mt-1 text-muted-foreground">Últimos {MONTHS_BACK} meses de actividad de tu consultorio.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Citas por mes</CardTitle>
                <CardDescription>Todas las citas creadas, sin importar su estado final.</CardDescription>
              </div>
              <ExportCsvButton
                filename="citas-por-mes.csv"
                rows={[["Mes", "Citas", "Canceladas", "No-shows"], ...months.map((m) => [
                  m.label,
                  appointmentsByMonth.get(m.key) ?? 0,
                  cancelledByMonth.get(m.key) ?? 0,
                  noShowByMonth.get(m.key) ?? 0,
                ])]}
              />
            </div>
          </CardHeader>
          <CardContent>
            <SimpleBarChart data={appointmentsData} colorVar="--chart-1" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Ingresos por mes</CardTitle>
                <CardDescription>Pagos aprobados (todas las pasarelas).</CardDescription>
              </div>
              <ExportCsvButton
                filename="ingresos-por-mes.csv"
                rows={[["Mes", "Ingresos (COP)"], ...months.map((m) => [m.label, revenueByMonth.get(m.key) ?? 0])]}
              />
            </div>
          </CardHeader>
          <CardContent>
            <SimpleBarChart
              data={revenueData}
              colorVar="--chart-2"
              formatValue={(v) => (v >= 1000 ? `$${Math.round(v / 1000)}k` : `$${v}`)}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pacientes nuevos por mes</CardTitle>
            <CardDescription>Registrados automáticamente al reservar o manualmente.</CardDescription>
          </CardHeader>
          <CardContent>
            <SimpleBarChart
              data={months.map((m) => ({ label: m.label, value: newPatientsByMonth.get(m.key) ?? 0 }))}
              colorVar="--chart-3"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Servicios más reservados</CardTitle>
            <CardDescription>Últimos {MONTHS_BACK} meses.</CardDescription>
          </CardHeader>
          <CardContent>
            {topServices.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sin datos todavía.</p>
            ) : (
              <table className="w-full text-sm">
                <tbody>
                  {topServices.map((s) => (
                    <tr key={s.name} className="border-b last:border-0">
                      <td className="py-2 text-foreground">{s.name}</td>
                      <td className="py-2 text-right font-medium">{s.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

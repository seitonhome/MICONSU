import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { LicenseForm } from "./license-form";
import { SupportSubscriptionForm } from "./support-subscription-form";
import { ModuleToggle } from "./module-toggle";
import { MODULE_KEYS, MODULE_KEY_LABELS } from "@/lib/domain/labels";

export default async function ClinicAdminDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: clinic } = await supabase.from("clinics").select("*").eq("id", id).single();
  if (!clinic) notFound();

  const [{ data: license }, { data: subscription }, { data: enabledModules }, { data: professionals }, { data: renewals }] =
    await Promise.all([
      supabase.from("licenses").select("*").eq("clinic_id", id).maybeSingle(),
      supabase.from("support_subscriptions").select("*").eq("clinic_id", id).maybeSingle(),
      supabase.from("enabled_modules").select("*").eq("clinic_id", id),
      supabase.from("professionals").select("id").eq("clinic_id", id).is("deleted_at", null),
      supabase
        .from("support_subscription_renewals")
        .select("*")
        .eq("clinic_id", id)
        .order("created_at", { ascending: false }),
    ]);

  const { data: plan } = subscription
    ? await supabase.from("support_plans").select("plan_key").eq("id", subscription.support_plan_id).maybeSingle()
    : { data: null };

  const moduleByKey = new Map((enabledModules ?? []).map((m) => [m.module_key, m.is_active]));

  const planKeyIds = Array.from(new Set((renewals ?? []).map((r) => r.support_plan_id)));
  const { data: renewalPlans } = planKeyIds.length > 0
    ? await supabase.from("support_plans").select("id, plan_key").in("id", planKeyIds)
    : { data: [] as { id: string; plan_key: string }[] };
  const planKeyById = new Map((renewalPlans ?? []).map((p) => [p.id, p.plan_key]));

  return (
    <div className="max-w-3xl space-y-8">
      <Button variant="ghost" size="sm" render={<Link href="/admin/consultorios" />}>
        <ArrowLeft className="size-4" /> Consultorios
      </Button>

      <div>
        <h1 className="text-2xl font-semibold">{clinic.commercial_name}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          /{clinic.slug} · {professionals?.length ?? 0} profesional(es) · {clinic.is_published ? "Publicado" : "No publicado"}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Licencia</CardTitle>
          <CardDescription>Plan contratado y límites de uso.</CardDescription>
        </CardHeader>
        <CardContent>
          <LicenseForm clinicId={id} license={license ?? null} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Plan Continuidad Clínica</CardTitle>
          <CardDescription>Soporte activo y fecha de vencimiento.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <SupportSubscriptionForm clinicId={id} subscription={subscription ?? null} planKey={plan?.plan_key ?? "esencial"} />
          {renewals && renewals.length > 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground">Historial de renovaciones</p>
              <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                {renewals.map((r) => (
                  <li key={r.id} className="flex items-center justify-between">
                    <span>
                      {new Date(r.created_at).toLocaleDateString("es-CO")} · Plan {planKeyById.get(r.support_plan_id) ?? "—"} ·{" "}
                      {r.status}
                    </span>
                    <span>Vence: {r.ends_at ? new Date(r.ends_at).toLocaleDateString("es-CO") : "—"}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Módulos</CardTitle>
          <CardDescription>Activa módulos adicionales cobrables para este consultorio.</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="divide-y">
            {MODULE_KEYS.map((key) => (
              <li key={key} className="flex items-center justify-between py-2">
                <span className="text-sm">{MODULE_KEY_LABELS[key]}</span>
                <ModuleToggle clinicId={id} moduleKey={key} isActive={moduleByKey.get(key) ?? false} />
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

import Link from "next/link";
import { LifeBuoy } from "lucide-react";
import { requireCurrentProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { TicketDialog } from "./ticket-dialog";
import { syncTicketsStatusFromSeiton } from "./sync";
import {
  SUPPORT_TICKET_STATUS_LABELS,
  SUPPORT_TICKET_PRIORITY_LABELS,
  LICENSE_STATUS_LABELS,
  SUPPORT_SUBSCRIPTION_STATUS_LABELS,
} from "@/lib/domain/labels";
import { BADGE_PRIMARY, BADGE_ACCENT, BADGE_OUTLINE, BADGE_DESTRUCTIVE } from "@/lib/utils/badge-styles";

const TICKET_STATUS_BADGE_CLASS: Record<string, string> = {
  open: BADGE_OUTLINE,
  in_review: BADGE_PRIMARY,
  waiting_client: BADGE_PRIMARY,
  in_progress: BADGE_PRIMARY,
  resolved: BADGE_ACCENT,
  closed: BADGE_OUTLINE,
  escalated: BADGE_DESTRUCTIVE,
};

export default async function SoportePage() {
  const profile = await requireCurrentProfile();
  const supabase = await createClient();

  if (!profile.clinicId) {
    return <p className="text-muted-foreground">No tienes un consultorio asociado.</p>;
  }

  const [{ data: tickets }, { data: license }, { data: subscription }] = await Promise.all([
    supabase
      .from("support_tickets")
      .select("*")
      .eq("clinic_id", profile.clinicId)
      .order("created_at", { ascending: false }),
    supabase.from("licenses").select("*").eq("clinic_id", profile.clinicId).maybeSingle(),
    supabase.from("support_subscriptions").select("*").eq("clinic_id", profile.clinicId).maybeSingle(),
  ]);

  const { data: supportPlan } = subscription
    ? await supabase.from("support_plans").select("name").eq("id", subscription.support_plan_id).maybeSingle()
    : { data: null };

  const seitonUpdates = await syncTicketsStatusFromSeiton(tickets ?? []);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground">Soporte</h1>
          <p className="mt-1 text-muted-foreground">Plan Continuidad Clínica: soporte, backups y continuidad de tu consultorio.</p>
        </div>
        <TicketDialog />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="rounded-[16px] border-black/[0.07]">
          <CardHeader>
            <CardTitle>Licencia</CardTitle>
            <CardDescription>
              {license ? (
                <>
                  Plan {license.license_type} · {license.professionals_allowed} profesional(es) · {license.locations_allowed} sede(s)
                </>
              ) : (
                "Sin licencia asignada todavía."
              )}
            </CardDescription>
          </CardHeader>
          {license && (
            <div className="px-4 pb-4">
              <Badge variant="outline" className={license.status === "active" ? BADGE_ACCENT : BADGE_OUTLINE}>
                {LICENSE_STATUS_LABELS[license.status] ?? license.status}
              </Badge>
            </div>
          )}
        </Card>

        <Card className="rounded-[16px] border-black/[0.07]">
          <CardHeader>
            <CardTitle>Plan Continuidad Clínica</CardTitle>
            <CardDescription>
              {subscription
                ? `${supportPlan?.name ?? "Plan"}${subscription.ends_at ? ` · vence ${new Date(subscription.ends_at).toLocaleDateString("es-CO")}` : ""}`
                : "Sin suscripción de soporte activa."}
            </CardDescription>
          </CardHeader>
          {subscription && (
            <div className="px-4 pb-4">
              <Badge variant="outline" className={subscription.status === "active" ? BADGE_ACCENT : BADGE_OUTLINE}>
                {SUPPORT_SUBSCRIPTION_STATUS_LABELS[subscription.status] ?? subscription.status}
              </Badge>
            </div>
          )}
        </Card>
      </div>

      {!tickets || tickets.length === 0 ? (
        <div className="rounded-2xl border border-dashed p-10 text-center">
          <LifeBuoy className="mx-auto size-8 text-muted-foreground" />
          <p className="mt-3 font-medium">No tienes tickets de soporte.</p>
          <p className="mt-1 text-sm text-muted-foreground">Crea uno si necesitas ayuda con tu consultorio.</p>
        </div>
      ) : (
        <ul className="divide-y divide-black/[0.06] overflow-hidden rounded-[16px] border border-black/[0.07] bg-card">
          {tickets.map((t) => {
            const currentStatus = seitonUpdates.get(t.id) ?? t.status;
            return (
              <li key={t.id}>
                <Link href={`/dashboard/soporte/${t.id}`} className="flex items-center justify-between gap-4 px-5 py-4 hover:bg-muted/40">
                  <div className="min-w-0">
                    <p className="truncate text-[13.5px] font-semibold text-foreground/90">{t.subject}</p>
                    <p className="text-xs text-muted-foreground">
                      {SUPPORT_TICKET_PRIORITY_LABELS[t.priority]} · {new Date(t.created_at).toLocaleDateString("es-CO")}
                    </p>
                  </div>
                  <Badge variant="outline" className={TICKET_STATUS_BADGE_CLASS[currentStatus] ?? BADGE_OUTLINE}>
                    {SUPPORT_TICKET_STATUS_LABELS[currentStatus as keyof typeof SUPPORT_TICKET_STATUS_LABELS] ?? currentStatus}
                  </Badge>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

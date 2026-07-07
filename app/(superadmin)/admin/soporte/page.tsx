import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { SUPPORT_TICKET_STATUS_LABELS, SUPPORT_TICKET_PRIORITY_LABELS } from "@/lib/domain/labels";
import type { Database } from "@/lib/supabase/types";

export default async function AdminSoportePage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const supabase = await createClient();
  const { status } = await searchParams;

  const query = supabase.from("support_tickets").select("*").order("priority").order("created_at", { ascending: false });
  const { data: tickets } = status
    ? await query.eq("status", status as Database["public"]["Enums"]["support_ticket_status"])
    : await query.in("status", ["open", "in_review", "waiting_client", "in_progress"]);

  const clinicIds = Array.from(new Set((tickets ?? []).map((t) => t.clinic_id)));
  const { data: clinics } = clinicIds.length > 0
    ? await supabase.from("clinics").select("id, commercial_name").in("id", clinicIds)
    : { data: [] as { id: string; commercial_name: string }[] };
  const clinicNameById = new Map((clinics ?? []).map((c) => [c.id, c.commercial_name]));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Soporte — todos los consultorios</h1>
        <p className="mt-1 text-muted-foreground">Tickets del Plan Continuidad Clínica de toda la plataforma.</p>
      </div>

      {!tickets || tickets.length === 0 ? (
        <p className="text-sm text-muted-foreground">No hay tickets en este filtro.</p>
      ) : (
        <ul className="divide-y rounded-xl border bg-background">
          {tickets.map((t) => (
            <li key={t.id}>
              <Link href={`/admin/soporte/${t.id}`} className="flex items-center justify-between gap-4 px-4 py-3 hover:bg-muted/50">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{t.subject}</p>
                  <p className="text-xs text-muted-foreground">
                    {clinicNameById.get(t.clinic_id) ?? "Consultorio"} · {SUPPORT_TICKET_PRIORITY_LABELS[t.priority]}
                  </p>
                </div>
                <Badge variant="outline">{SUPPORT_TICKET_STATUS_LABELS[t.status]}</Badge>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

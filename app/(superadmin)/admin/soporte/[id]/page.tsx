import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusSelect } from "./status-select";
import { AssignButton } from "./assign-button";
import { AdminCommentForm } from "./admin-comment-form";
import { SUPPORT_TICKET_PRIORITY_LABELS, SUPPORT_TICKET_CATEGORY_LABELS } from "@/lib/domain/labels";

export default async function AdminTicketDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: ticket } = await supabase.from("support_tickets").select("*").eq("id", id).single();
  if (!ticket) notFound();

  const [{ data: clinic }, { data: comments }] = await Promise.all([
    supabase.from("clinics").select("commercial_name, slug").eq("id", ticket.clinic_id).single(),
    supabase.from("support_ticket_comments").select("*").eq("ticket_id", id).order("created_at"),
  ]);

  const authorIds = Array.from(new Set((comments ?? []).map((c) => c.author_profile_id).filter((v): v is string => Boolean(v))));
  const { data: authors } = authorIds.length > 0
    ? await supabase.from("profiles").select("id, full_name").in("id", authorIds)
    : { data: [] as { id: string; full_name: string }[] };
  const authorNameById = new Map((authors ?? []).map((a) => [a.id, a.full_name]));

  return (
    <div className="max-w-2xl space-y-6">
      <Button variant="ghost" size="sm" render={<Link href="/admin/soporte" />}>
        <ArrowLeft className="size-4" /> Soporte
      </Button>

      <div>
        <h1 className="text-xl font-semibold">{ticket.subject}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {clinic?.commercial_name} · {SUPPORT_TICKET_CATEGORY_LABELS[ticket.category]} · Prioridad{" "}
          {SUPPORT_TICKET_PRIORITY_LABELS[ticket.priority]}
        </p>
        {ticket.description && <p className="mt-3 text-sm">{ticket.description}</p>}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <StatusSelect ticketId={id} status={ticket.status} />
        <AssignButton ticketId={id} alreadyAssigned={Boolean(ticket.assigned_to)} />
      </div>

      <div className="space-y-3">
        {(comments ?? []).map((c) => (
          <div key={c.id} className={`rounded-xl border p-3 ${c.is_internal ? "bg-muted/40" : ""}`}>
            <div className="flex items-center gap-2">
              <p className="text-xs font-medium text-muted-foreground">
                {authorNameById.get(c.author_profile_id ?? "") ?? "Usuario"} · {new Date(c.created_at).toLocaleString("es-CO")}
              </p>
              {c.is_internal && <Badge variant="outline">Interno</Badge>}
            </div>
            <p className="mt-1 text-sm">{c.body}</p>
          </div>
        ))}
      </div>

      <AdminCommentForm ticketId={id} />
    </div>
  );
}

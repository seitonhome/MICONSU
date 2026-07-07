import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireCurrentProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CommentForm } from "./comment-form";
import {
  SUPPORT_TICKET_STATUS_LABELS,
  SUPPORT_TICKET_PRIORITY_LABELS,
  SUPPORT_TICKET_CATEGORY_LABELS,
} from "@/lib/domain/labels";

export default async function TicketDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const profile = await requireCurrentProfile();
  const supabase = await createClient();

  const { data: ticket } = await supabase
    .from("support_tickets")
    .select("*")
    .eq("id", id)
    .eq("clinic_id", profile.clinicId!)
    .single();

  if (!ticket) notFound();

  const { data: comments } = await supabase
    .from("support_ticket_comments")
    .select("*")
    .eq("ticket_id", id)
    .eq("is_internal", false)
    .order("created_at");

  const authorIds = Array.from(new Set((comments ?? []).map((c) => c.author_profile_id).filter((v): v is string => Boolean(v))));
  const { data: authors } = authorIds.length > 0
    ? await supabase.from("profiles").select("id, full_name").in("id", authorIds)
    : { data: [] as { id: string; full_name: string }[] };
  const authorNameById = new Map((authors ?? []).map((a) => [a.id, a.full_name]));

  return (
    <div className="max-w-2xl space-y-6">
      <Button variant="ghost" size="sm" render={<Link href="/dashboard/soporte" />}>
        <ArrowLeft className="size-4" /> Soporte
      </Button>

      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-semibold">{ticket.subject}</h1>
          <Badge variant="outline">{SUPPORT_TICKET_STATUS_LABELS[ticket.status]}</Badge>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          {SUPPORT_TICKET_CATEGORY_LABELS[ticket.category]} · Prioridad {SUPPORT_TICKET_PRIORITY_LABELS[ticket.priority]} ·{" "}
          {new Date(ticket.created_at).toLocaleString("es-CO")}
        </p>
        {ticket.description && <p className="mt-3 text-sm">{ticket.description}</p>}
      </div>

      <div className="space-y-3">
        {(comments ?? []).map((c) => (
          <div key={c.id} className="rounded-xl border p-3">
            <p className="text-xs font-medium text-muted-foreground">
              {authorNameById.get(c.author_profile_id ?? "") ?? "Equipo de soporte"} ·{" "}
              {new Date(c.created_at).toLocaleString("es-CO")}
            </p>
            <p className="mt-1 text-sm">{c.body}</p>
          </div>
        ))}
      </div>

      <CommentForm ticketId={id} />
    </div>
  );
}

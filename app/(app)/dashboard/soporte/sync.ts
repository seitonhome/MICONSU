import "server-only";
import { createClient } from "@/lib/supabase/server";
import { fetchSeitonTicketStatus } from "@/lib/integrations/seiton-pqr";
import type { Database } from "@/lib/supabase/types";

type Ticket = Database["public"]["Tables"]["support_tickets"]["Row"];

/**
 * Ve si alguno de estos tickets fue cerrado/actualizado desde el panel de
 * Seiton (seitonhome.com/admin/pqr) y, si es así, refleja el estado en la
 * fila local. Solo consulta tickets no cerrados que sí se reenviaron a
 * Seiton en su momento (seiton_ticket_id). Devuelve un mapa id -> nuevo
 * estado para poder reflejarlo de inmediato sin una segunda consulta.
 */
export async function syncTicketsStatusFromSeiton(tickets: Ticket[]): Promise<Map<string, string>> {
  const updates = new Map<string, string>();
  const candidates = tickets.filter((t) => t.seiton_ticket_id && t.status !== "closed");
  if (candidates.length === 0) return updates;

  const supabase = await createClient();
  const creatorIds = Array.from(
    new Set(candidates.map((t) => t.created_by).filter((v): v is string => Boolean(v))),
  );
  if (creatorIds.length === 0) return updates;

  const { data: profiles } = await supabase.from("profiles").select("id, email").in("id", creatorIds);
  const emailById = new Map((profiles ?? []).map((p) => [p.id, p.email]));

  await Promise.all(
    candidates.map(async (t) => {
      const email = t.created_by ? emailById.get(t.created_by) : null;
      if (!email || !t.seiton_ticket_id) return;

      const status = await fetchSeitonTicketStatus(t.seiton_ticket_id, email);
      if (status && status !== t.status) {
        await supabase
          .from("support_tickets")
          .update({ status: status as Ticket["status"] })
          .eq("id", t.id);
        updates.set(t.id, status);
      }
    }),
  );

  return updates;
}

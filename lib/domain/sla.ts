import type { Database } from "@/lib/supabase/types";

type TicketPriority = Database["public"]["Enums"]["support_ticket_priority"];
type TicketStatus = Database["public"]["Enums"]["support_ticket_status"];

/**
 * Objetivos de SLA del Plan Continuidad Clínica por prioridad (ver
 * SUPPORT.md). "low" no tiene objetivo de resolución fijo — se evalúa en
 * roadmap, así que resolutionHours queda null.
 */
export const SLA_TARGETS: Record<TicketPriority, { firstResponseHours: number; resolutionHours: number | null }> = {
  critical: { firstResponseHours: 1, resolutionHours: 8 },
  high: { firstResponseHours: 4, resolutionHours: 48 },
  medium: { firstResponseHours: 24, resolutionHours: 120 },
  low: { firstResponseHours: 48, resolutionHours: null },
};

export type SlaTicket = {
  priority: TicketPriority;
  status: TicketStatus;
  created_at: string;
  first_response_at: string | null;
  resolved_at: string | null;
};

const CLOSED_STATUSES: TicketStatus[] = ["resolved", "closed"];

export type SlaEvaluation = {
  firstResponseHoursElapsed: number | null;
  firstResponseBreached: boolean;
  resolutionHoursElapsed: number | null;
  resolutionBreached: boolean;
};

/** Evalúa el estado de SLA de un ticket contra los objetivos de su prioridad. */
export function evaluateSla(ticket: SlaTicket): SlaEvaluation {
  const target = SLA_TARGETS[ticket.priority];
  const createdAt = new Date(ticket.created_at).getTime();
  const now = Date.now();

  const firstResponseEndpoint = ticket.first_response_at ? new Date(ticket.first_response_at).getTime() : now;
  const firstResponseHoursElapsed = (firstResponseEndpoint - createdAt) / (1000 * 60 * 60);
  const firstResponseBreached = !ticket.first_response_at && firstResponseHoursElapsed > target.firstResponseHours;

  let resolutionHoursElapsed: number | null = null;
  let resolutionBreached = false;
  if (target.resolutionHours !== null) {
    const resolutionEndpoint = ticket.resolved_at ? new Date(ticket.resolved_at).getTime() : now;
    resolutionHoursElapsed = (resolutionEndpoint - createdAt) / (1000 * 60 * 60);
    resolutionBreached = !CLOSED_STATUSES.includes(ticket.status) && resolutionHoursElapsed > target.resolutionHours;
  }

  return {
    firstResponseHoursElapsed: ticket.first_response_at
      ? (new Date(ticket.first_response_at).getTime() - createdAt) / (1000 * 60 * 60)
      : null,
    firstResponseBreached,
    resolutionHoursElapsed: ticket.resolved_at ? resolutionHoursElapsed : resolutionHoursElapsed,
    resolutionBreached,
  };
}

/** Promedio en horas de un arreglo de duraciones, ignorando nulos. Null si no hay datos. */
export function averageHours(values: Array<number | null>): number | null {
  const valid = values.filter((v): v is number => v !== null);
  if (valid.length === 0) return null;
  return valid.reduce((sum, v) => sum + v, 0) / valid.length;
}

export function formatHours(hours: number | null): string {
  if (hours === null) return "—";
  if (hours < 1) return `${Math.round(hours * 60)} min`;
  if (hours < 48) return `${hours.toFixed(1)} h`;
  return `${(hours / 24).toFixed(1)} d`;
}

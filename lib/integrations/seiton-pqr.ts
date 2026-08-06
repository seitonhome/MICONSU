import "server-only";

// Reenvía los tickets de soporte al PQR central de Seiton
// (https://www.seitonhome.com/admin/pqr), donde ya llegan los tickets del
// resto de las apps del catálogo. Ver POST/GET /api/pqr en el repo seiton:
// sin autenticación, rate limit de 5 req/30min por IP de origen, y el
// enum marketCode solo acepta "CO" o "CA".
//
// No debe romper la creación del ticket local si Seiton no responde — es
// un best-effort, no la fuente de verdad del ticket. La sincronización de
// estado (cuando el equipo lo gestiona desde el admin de Seiton en vez de
// /admin/soporte de esta app) también es best-effort: si falla, el ticket
// local simplemente se queda con el estado que tenía.

const SEITON_PQR_URL = "https://www.seitonhome.com/api/pqr";
const APP_NAME = "Mi Consultorio Pro";

type SeitonTicketStatus = "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";

// Seiton solo maneja 4 estados; los locales más finos (in_review,
// waiting_client, escalated) no tienen equivalente ahí, así que un ticket
// solo se sobreescribe cuando Seiton reporta un estado distinto al actual.
const SEITON_STATUS_TO_LOCAL: Record<SeitonTicketStatus, string> = {
  OPEN: "open",
  IN_PROGRESS: "in_progress",
  RESOLVED: "resolved",
  CLOSED: "closed",
};

export async function forwardTicketToSeitonPqr(params: {
  customerName: string;
  customerEmail: string;
  subject: string;
  category: string;
  priority: string;
  description: string | null;
}): Promise<string | null> {
  const body = [
    `Categoría: ${params.category} · Prioridad: ${params.priority}`,
    params.description ?? "(sin descripción)",
  ].join("\n\n");

  try {
    const res = await fetch(SEITON_PQR_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customerName: params.customerName,
        customerEmail: params.customerEmail,
        subject: `[${APP_NAME}] ${params.subject}`,
        body,
        type: "QUESTION",
        marketCode: "CO",
        source: "seiton-apps",
        appName: APP_NAME,
      }),
      signal: AbortSignal.timeout(5000),
    });
    const data = await res.json();
    return data?.ok ? (data.ticket?.id ?? null) : null;
  } catch (error) {
    console.error("No se pudo reenviar el ticket a Seiton PQR:", error);
    return null;
  }
}

/**
 * Consulta el estado actual de un ticket en Seiton (filtrando por el correo
 * de quien lo creó, ya que /api/pqr no permite buscar por id directamente).
 * Devuelve el estado local equivalente, o null si no se pudo determinar.
 */
export async function fetchSeitonTicketStatus(
  seitonTicketId: string,
  customerEmail: string,
): Promise<string | null> {
  try {
    const url = new URL(SEITON_PQR_URL);
    url.searchParams.set("email", customerEmail);
    url.searchParams.set("source", "seiton-apps");
    url.searchParams.set("limit", "50");

    const res = await fetch(url.toString(), { signal: AbortSignal.timeout(5000) });
    const data = await res.json();
    if (!data?.ok) return null;

    const match = (data.tickets as { id: string; status: SeitonTicketStatus }[] | undefined)?.find(
      (t) => t.id === seitonTicketId,
    );
    if (!match) return null;

    return SEITON_STATUS_TO_LOCAL[match.status] ?? null;
  } catch (error) {
    console.error("No se pudo consultar el estado del ticket en Seiton PQR:", error);
    return null;
  }
}

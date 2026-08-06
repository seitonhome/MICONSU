import "server-only";

// Reenvía los tickets de soporte al PQR central de Seiton
// (https://www.seitonhome.com/admin/pqr), donde ya llegan los tickets del
// resto de las apps del catálogo. Ver POST /api/pqr en el repo seiton:
// sin autenticación, rate limit de 5 req/30min por IP de origen, y el
// enum marketCode solo acepta "CO" o "CA".
//
// No debe romper la creación del ticket local si Seiton no responde — es
// un best-effort, no la fuente de verdad del ticket.

const SEITON_PQR_URL = "https://www.seitonhome.com/api/pqr";
const APP_NAME = "Mi Consultorio Pro";

export async function forwardTicketToSeitonPqr(params: {
  customerName: string;
  customerEmail: string;
  subject: string;
  category: string;
  priority: string;
  description: string | null;
}): Promise<void> {
  const body = [
    `Categoría: ${params.category} · Prioridad: ${params.priority}`,
    params.description ?? "(sin descripción)",
  ].join("\n\n");

  try {
    await fetch(SEITON_PQR_URL, {
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
  } catch (error) {
    console.error("No se pudo reenviar el ticket a Seiton PQR:", error);
  }
}

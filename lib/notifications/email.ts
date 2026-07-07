import "server-only";

export async function sendEmail(params: { to: string; subject: string; html: string }): Promise<{
  ok: boolean;
  error?: string;
}> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM || "Mi Consultorio Pro <notificaciones@tudominio.com>";

  if (!apiKey) {
    return { ok: false, error: "RESEND_API_KEY no está configurado." };
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from, to: params.to, subject: params.subject, html: params.html }),
    });

    if (!response.ok) {
      const body = await response.text();
      return { ok: false, error: `Resend respondió ${response.status}: ${body}` };
    }

    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Error desconocido enviando el correo." };
  }
}

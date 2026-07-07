import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { notifyAppointment } from "@/lib/notifications/notify";

const ACTIVE_STATUSES = ["confirmed", "paid", "pending_manual_confirmation"] as const;

/**
 * Job de recordatorios (24h y 2h antes de la cita). Pensado para correr cada
 * hora vía Vercel Cron (ver vercel.json) protegido con CRON_SECRET. Cada
 * ventana es de +/-30 min alrededor del punto exacto para tolerar que el cron
 * no dispare al segundo; notifyAppointment ya es idempotente por cita+plantilla.
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const admin = createAdminClient();
  const now = Date.now();

  const windows = [
    { templateKey: "appointment_reminder_24h" as const, hoursBefore: 24 },
    { templateKey: "appointment_reminder_2h" as const, hoursBefore: 2 },
  ];

  let sent = 0;
  let skipped = 0;
  let failed = 0;

  for (const window of windows) {
    const center = now + window.hoursBefore * 3600000;
    const rangeStart = new Date(center - 30 * 60000).toISOString();
    const rangeEnd = new Date(center + 30 * 60000).toISOString();

    const { data: appointments } = await admin
      .from("appointments")
      .select("id")
      .in("status", ACTIVE_STATUSES)
      .is("deleted_at", null)
      .gte("starts_at", rangeStart)
      .lt("starts_at", rangeEnd);

    for (const appointment of appointments ?? []) {
      const result = await notifyAppointment(admin, appointment.id, window.templateKey);
      if (result.skipped) skipped += 1;
      else if (result.ok) sent += 1;
      else failed += 1;
    }
  }

  return NextResponse.json({ ok: true, sent, skipped, failed });
}

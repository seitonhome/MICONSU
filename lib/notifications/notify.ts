import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";
import { sendEmail } from "./email";
import { renderTemplate, type PaymentEmailData } from "./templates";

type Client = SupabaseClient<Database>;
type TemplateKey = Database["public"]["Enums"]["notification_template_key"];

function formatDateLabel(date: Date): string {
  return date.toLocaleDateString("es-CO", { weekday: "long", day: "numeric", month: "long" });
}

function formatTimeLabel(date: Date): string {
  return date.toLocaleTimeString("es-CO", { hour: "numeric", minute: "2-digit" });
}

function fillPlaceholders(text: string, data: PaymentEmailData): string {
  return text
    .replaceAll("{{clinicName}}", data.clinicName)
    .replaceAll("{{patientFirstName}}", data.patientFirstName)
    .replaceAll("{{dateLabel}}", data.dateLabel)
    .replaceAll("{{timeLabel}}", data.timeLabel)
    .replaceAll("{{managementUrl}}", data.managementUrl)
    .replaceAll("{{amountLabel}}", data.amountLabel);
}

/**
 * Envía (o registra por qué no se envió) una notificación de cita. Idempotente
 * para recordatorios: notification_logs tiene un índice único
 * (appointment_id, template_key) para status='sent', así que llamar dos veces
 * el mismo recordatorio para la misma cita no duplica el envío.
 */
export async function notifyAppointment(
  admin: Client,
  appointmentId: string,
  templateKey: TemplateKey,
): Promise<{ ok: boolean; skipped?: boolean; error?: string }> {
  const { data: appointment } = await admin
    .from("appointments")
    .select("id, clinic_id, patient_id, starts_at, price, booking_token")
    .eq("id", appointmentId)
    .single();

  if (!appointment) return { ok: false, error: "Cita no encontrada." };

  const { data: alreadySent } = await admin
    .from("notification_logs")
    .select("id")
    .eq("appointment_id", appointment.id)
    .eq("template_key", templateKey)
    .eq("status", "sent")
    .maybeSingle();

  if (alreadySent) return { ok: true, skipped: true };

  const [{ data: clinic }, { data: patient }] = await Promise.all([
    admin.from("clinics").select("commercial_name").eq("id", appointment.clinic_id).single(),
    admin.from("patients").select("full_name, email").eq("id", appointment.patient_id).single(),
  ]);

  if (!patient?.email) {
    await admin.from("notification_logs").insert({
      clinic_id: appointment.clinic_id,
      appointment_id: appointment.id,
      patient_id: appointment.patient_id,
      template_key: templateKey,
      channel: "email",
      status: "skipped",
      error: "El paciente no tiene correo registrado.",
    });
    return { ok: false, skipped: true };
  }

  const startsAt = new Date(appointment.starts_at);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";

  const emailData: PaymentEmailData = {
    clinicName: clinic?.commercial_name ?? "tu consultorio",
    patientFirstName: patient.full_name?.split(" ")[0] ?? "",
    dateLabel: formatDateLabel(startsAt),
    timeLabel: formatTimeLabel(startsAt),
    managementUrl: `${appUrl}/reserva/${appointment.booking_token}`,
    amountLabel: `$${Number(appointment.price).toLocaleString("es-CO")}`,
  };

  const { data: customTemplate } = await admin
    .from("notification_templates")
    .select("subject, body")
    .eq("clinic_id", appointment.clinic_id)
    .eq("template_key", templateKey)
    .eq("channel", "email")
    .eq("is_active", true)
    .maybeSingle();

  const { subject, html } = customTemplate
    ? {
        subject: fillPlaceholders(customTemplate.subject ?? renderTemplate(templateKey, emailData).subject, emailData),
        html: fillPlaceholders(customTemplate.body, emailData),
      }
    : renderTemplate(templateKey, emailData);

  const result = await sendEmail({ to: patient.email, subject, html });

  await admin.from("notification_logs").insert({
    clinic_id: appointment.clinic_id,
    appointment_id: appointment.id,
    patient_id: appointment.patient_id,
    template_key: templateKey,
    channel: "email",
    recipient: patient.email,
    status: result.ok ? "sent" : "failed",
    error: result.error ?? null,
  });

  return { ok: result.ok, error: result.error };
}

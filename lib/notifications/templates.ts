import type { Database } from "@/lib/supabase/types";

export type AppointmentEmailData = {
  clinicName: string;
  patientFirstName: string;
  dateLabel: string;
  timeLabel: string;
  managementUrl: string;
};

export type PaymentEmailData = AppointmentEmailData & {
  amountLabel: string;
};

/**
 * Copys neutrales a propósito (brief: "Reglas de responsabilidad legal y
 * comercial" + ejemplo de recordatorio): nunca mencionan especialidad,
 * diagnóstico ni motivo de consulta, para no exponer información sensible
 * a quien vea la pantalla del paciente.
 */
function wrapper(clinicName: string, contentHtml: string): string {
  return `<div style="font-family: -apple-system, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; color: #1f2937;">
  <p style="font-size: 11px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.06em; margin: 0 0 16px;">${clinicName}</p>
  ${contentHtml}
  <p style="margin-top: 32px; font-size: 12px; color: #9ca3af;">Este mensaje fue enviado por Mi Consultorio Pro en nombre de ${clinicName}.</p>
</div>`;
}

function greeting(name: string): string {
  return name ? `Hola, ${name}` : "Hola";
}

export function appointmentConfirmationEmail(data: AppointmentEmailData) {
  return {
    subject: `Tu cita está confirmada — ${data.clinicName}`,
    html: wrapper(
      data.clinicName,
      `<h2 style="margin:0 0 12px;">${greeting(data.patientFirstName)}</h2>
       <p>Tienes una cita programada con <strong>${data.clinicName}</strong> el ${data.dateLabel} a las ${data.timeLabel}.</p>
       <p><a href="${data.managementUrl}" style="color:#0F4C4C;">Ver, reprogramar o cancelar tu cita</a></p>`,
    ),
  };
}

export function appointmentReminder24hEmail(data: AppointmentEmailData) {
  return {
    subject: `Recordatorio: tienes una cita mañana — ${data.clinicName}`,
    html: wrapper(
      data.clinicName,
      `<h2 style="margin:0 0 12px;">${greeting(data.patientFirstName)}</h2>
       <p>Te recordamos tu cita con <strong>${data.clinicName}</strong> mañana, ${data.dateLabel} a las ${data.timeLabel}.</p>
       <p><a href="${data.managementUrl}" style="color:#0F4C4C;">Ver o modificar tu cita</a></p>`,
    ),
  };
}

export function appointmentReminder2hEmail(data: AppointmentEmailData) {
  return {
    subject: `Tu cita es en 2 horas — ${data.clinicName}`,
    html: wrapper(
      data.clinicName,
      `<h2 style="margin:0 0 12px;">${greeting(data.patientFirstName)}</h2>
       <p>Tu cita con <strong>${data.clinicName}</strong> es hoy a las ${data.timeLabel}.</p>
       <p><a href="${data.managementUrl}" style="color:#0F4C4C;">Ver detalles de tu cita</a></p>`,
    ),
  };
}

export function appointmentCancelledEmail(data: AppointmentEmailData) {
  return {
    subject: `Tu cita fue cancelada — ${data.clinicName}`,
    html: wrapper(
      data.clinicName,
      `<h2 style="margin:0 0 12px;">${greeting(data.patientFirstName)}</h2>
       <p>Tu cita con <strong>${data.clinicName}</strong> del ${data.dateLabel} a las ${data.timeLabel} fue cancelada.</p>
       <p><a href="${data.managementUrl}" style="color:#0F4C4C;">Reservar un nuevo horario</a></p>`,
    ),
  };
}

export function appointmentRescheduledEmail(data: AppointmentEmailData) {
  return {
    subject: `Tu cita fue reprogramada — ${data.clinicName}`,
    html: wrapper(
      data.clinicName,
      `<h2 style="margin:0 0 12px;">${greeting(data.patientFirstName)}</h2>
       <p>Tu cita con <strong>${data.clinicName}</strong> ahora es el ${data.dateLabel} a las ${data.timeLabel}.</p>
       <p><a href="${data.managementUrl}" style="color:#0F4C4C;">Ver detalles de tu cita</a></p>`,
    ),
  };
}

export function paymentPendingEmail(data: PaymentEmailData) {
  return {
    subject: `Confirma tu pago — ${data.clinicName}`,
    html: wrapper(
      data.clinicName,
      `<h2 style="margin:0 0 12px;">${greeting(data.patientFirstName)}</h2>
       <p>Tu cita con <strong>${data.clinicName}</strong> del ${data.dateLabel} a las ${data.timeLabel} está pendiente de pago (${data.amountLabel}).</p>
       <p><a href="${data.managementUrl}" style="color:#0F4C4C;">Ver instrucciones de pago</a></p>`,
    ),
  };
}

export function paymentApprovedEmail(data: PaymentEmailData) {
  return {
    subject: `Pago confirmado — ${data.clinicName}`,
    html: wrapper(
      data.clinicName,
      `<h2 style="margin:0 0 12px;">${greeting(data.patientFirstName)}</h2>
       <p>Confirmamos tu pago de ${data.amountLabel} para tu cita del ${data.dateLabel} a las ${data.timeLabel} con <strong>${data.clinicName}</strong>.</p>
       <p><a href="${data.managementUrl}" style="color:#0F4C4C;">Ver detalles de tu cita</a></p>`,
    ),
  };
}

export function renderTemplate(
  key: Database["public"]["Enums"]["notification_template_key"],
  data: PaymentEmailData,
): { subject: string; html: string } {
  switch (key) {
    case "appointment_confirmation":
      return appointmentConfirmationEmail(data);
    case "appointment_reminder_24h":
      return appointmentReminder24hEmail(data);
    case "appointment_reminder_2h":
      return appointmentReminder2hEmail(data);
    case "appointment_cancelled":
      return appointmentCancelledEmail(data);
    case "appointment_rescheduled":
      return appointmentRescheduledEmail(data);
    case "payment_pending":
      return paymentPendingEmail(data);
    case "payment_approved":
      return paymentApprovedEmail(data);
  }
}

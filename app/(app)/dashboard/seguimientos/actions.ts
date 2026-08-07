"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/session";
import { sendEmail } from "@/lib/notifications/email";

export type FollowupActionState = { error?: string; success?: boolean };

type FollowupType = "thank_you" | "satisfaction_survey" | "review_request" | "package_renewal" | "custom";

function buildFollowupEmail(
  type: FollowupType,
  data: { clinicName: string; firstName: string; message: string | null; reviewUrl: string },
): { subject: string; html: string } {
  const greeting = data.firstName ? `Hola, ${data.firstName}` : "Hola";
  const wrap = (body: string) =>
    `<div style="font-family: -apple-system, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; color: #1f2937;">
      <p style="font-size: 11px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.06em; margin: 0 0 16px;">${data.clinicName}</p>
      <h2 style="margin:0 0 12px;">${greeting}</h2>
      ${body}
      <p style="margin-top: 32px; font-size: 12px; color: #9ca3af;">Este mensaje fue enviado por Mi Consultorio Pro en nombre de ${data.clinicName}.</p>
    </div>`;

  switch (type) {
    case "thank_you":
      return {
        subject: `Gracias por confiar en ${data.clinicName}`,
        html: wrap(`<p>${data.message || `Gracias por confiar en ${data.clinicName}. Fue un gusto atenderte.`}</p>`),
      };
    case "satisfaction_survey":
    case "review_request":
      return {
        subject: `¿Cómo fue tu experiencia con ${data.clinicName}?`,
        html: wrap(
          `<p>${data.message || "Tu opinión nos ayuda a mejorar y a que más personas nos conozcan."}</p>
           <p style="margin-top:16px;"><a href="${data.reviewUrl}" style="color:#0F4C4C;">Déjanos tu reseña</a></p>`,
        ),
      };
    case "package_renewal":
      return {
        subject: `Tu proceso con ${data.clinicName} — ¿seguimos?`,
        html: wrap(`<p>${data.message || "Tu paquete de sesiones está por terminar. Escríbenos si quieres renovarlo."}</p>`),
      };
    case "custom":
      return {
        subject: `Mensaje de ${data.clinicName}`,
        html: wrap(`<p>${data.message || ""}</p>`),
      };
  }
}

const STAFF_ROLES = ["clinic_owner", "assistant", "receptionist", "professional"] as const;

async function staffClinicId() {
  const profile = await requireRole([...STAFF_ROLES]);
  const supabase = await createClient();
  return { clinicId: profile.clinicId!, supabase };
}

export async function createFollowup(
  _prev: FollowupActionState | undefined,
  formData: FormData,
): Promise<FollowupActionState> {
  const { clinicId, supabase } = await staffClinicId();
  const patientId = formData.get("patient_id") as string;
  if (!patientId) return { error: "Selecciona un paciente." };

  const { error } = await supabase.from("post_consultation_followups").insert({
    clinic_id: clinicId,
    patient_id: patientId,
    followup_type: ((formData.get("followup_type") as string) || "thank_you") as
      | "thank_you"
      | "satisfaction_survey"
      | "review_request"
      | "package_renewal"
      | "custom",
    scheduled_for: (formData.get("scheduled_for") as string) || new Date().toISOString(),
    message: (formData.get("message") as string) || null,
  });

  if (error) return { error: "No pudimos crear el seguimiento." };

  revalidatePath("/dashboard/seguimientos");
  return { success: true };
}

export async function updateFollowupStatus(
  id: string,
  status: "pending" | "sent" | "completed" | "skipped",
): Promise<void> {
  const { supabase } = await staffClinicId();
  await supabase
    .from("post_consultation_followups")
    .update({ status, ...(status === "sent" ? { sent_at: new Date().toISOString() } : {}) })
    .eq("id", id);
  revalidatePath("/dashboard/seguimientos");
}

export async function sendFollowupNow(id: string): Promise<{ error?: string }> {
  const { clinicId, supabase } = await staffClinicId();

  const { data: followup } = await supabase
    .from("post_consultation_followups")
    .select("*")
    .eq("id", id)
    .single();
  if (!followup) return { error: "No encontramos este seguimiento." };

  const [{ data: patient }, { data: clinic }] = await Promise.all([
    supabase.from("patients").select("full_name, email").eq("id", followup.patient_id).single(),
    supabase.from("clinics").select("commercial_name, slug").eq("id", clinicId).single(),
  ]);

  if (!patient?.email) return { error: "Este paciente no tiene correo registrado." };

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
  const { subject, html } = buildFollowupEmail(followup.followup_type, {
    clinicName: clinic?.commercial_name ?? "tu consultorio",
    firstName: patient.full_name?.split(" ")[0] ?? "",
    message: followup.message,
    reviewUrl: `${appUrl}/c/${clinic?.slug}/resena?patient=${followup.patient_id}`,
  });

  const result = await sendEmail({ to: patient.email, subject, html });
  if (!result.ok) return { error: "No pudimos enviar el correo. Intenta de nuevo." };

  await supabase
    .from("post_consultation_followups")
    .update({ status: "sent", sent_at: new Date().toISOString() })
    .eq("id", id);
  revalidatePath("/dashboard/seguimientos");
  return {};
}

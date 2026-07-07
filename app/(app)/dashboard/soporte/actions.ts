"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireCurrentProfile } from "@/lib/auth/session";
import type { Database } from "@/lib/supabase/types";

export type SupportActionState = { error?: string; success?: boolean };

export async function createTicket(
  _prev: SupportActionState | undefined,
  formData: FormData,
): Promise<SupportActionState> {
  const profile = await requireCurrentProfile();
  if (!profile.clinicId) return { error: "No tienes un consultorio asociado." };

  const supabase = await createClient();
  const subject = (formData.get("subject") as string)?.trim();
  const description = (formData.get("description") as string) || null;
  const category = formData.get("category") as Database["public"]["Enums"]["support_ticket_category"];
  const priority = formData.get("priority") as Database["public"]["Enums"]["support_ticket_priority"];

  if (!subject) return { error: "El asunto es obligatorio." };

  const { data: ticket, error } = await supabase
    .from("support_tickets")
    .insert({
      clinic_id: profile.clinicId,
      created_by: profile.id,
      subject,
      description,
      category,
      priority,
    })
    .select("id")
    .single();

  if (error || !ticket) return { error: "No pudimos crear el ticket." };

  redirect(`/dashboard/soporte/${ticket.id}`);
}

export async function addTicketComment(
  ticketId: string,
  _prev: SupportActionState | undefined,
  formData: FormData,
): Promise<SupportActionState> {
  const profile = await requireCurrentProfile();
  const supabase = await createClient();
  const body = (formData.get("body") as string)?.trim();

  if (!body) return { error: "Escribe un mensaje." };

  const { error } = await supabase.from("support_ticket_comments").insert({
    ticket_id: ticketId,
    author_profile_id: profile.id,
    body,
  });

  if (error) return { error: "No pudimos enviar tu mensaje." };

  revalidatePath(`/dashboard/soporte/${ticketId}`);
  return { success: true };
}

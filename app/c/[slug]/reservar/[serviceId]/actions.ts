"use server";

import { headers } from "next/headers";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { getAvailableSlots } from "@/lib/booking/slots";
import { getPaymentProvider } from "@/lib/payments/provider-factory";
import { notifyAppointment } from "@/lib/notifications/notify";
import type { Database } from "@/lib/supabase/types";

export type BookingActionState = { error?: string; token?: string; checkoutUrl?: string };

export async function fetchSlotsAction(params: {
  clinicId: string;
  professionalId: string;
  durationMinutes: number;
  date: string;
  minAdvanceHours: number;
}): Promise<string[]> {
  const supabase = await createClient();
  return getAvailableSlots(supabase, params);
}

export async function createBookingAction(
  _prev: BookingActionState | undefined,
  formData: FormData,
): Promise<BookingActionState> {
  const admin = createAdminClient();

  const clinicSlug = formData.get("clinic_slug") as string;
  const serviceId = formData.get("service_id") as string;
  const professionalId = formData.get("professional_id") as string;
  const locationId = (formData.get("location_id") as string) || null;
  const date = formData.get("date") as string;
  const time = formData.get("time") as string;
  const modality = formData.get("modality") as "in_person" | "virtual";
  const paymentProviderKey = (formData.get("payment_provider_key") as string) || null;

  const fullName = (formData.get("full_name") as string)?.trim();
  const documentNumber = (formData.get("document_number") as string) || null;
  const email = (formData.get("email") as string) || null;
  const phone = (formData.get("phone") as string) || null;
  const acceptedDocumentIds = formData.getAll("accepted_document_ids").map(String);

  if (!fullName || !date || !time || !professionalId) {
    return { error: "Completa todos los campos obligatorios." };
  }

  const { data: clinic } = await admin
    .from("clinics")
    .select("id, is_published")
    .eq("slug", clinicSlug)
    .single();
  if (!clinic || !clinic.is_published) return { error: "Este consultorio no está disponible." };

  const { data: service } = await admin
    .from("services")
    .select("*")
    .eq("id", serviceId)
    .eq("clinic_id", clinic.id)
    .eq("is_active", true)
    .single();
  if (!service) return { error: "Este servicio ya no está disponible." };

  const { data: professional } = await admin
    .from("professionals")
    .select("id")
    .eq("id", professionalId)
    .eq("clinic_id", clinic.id)
    .eq("is_active", true)
    .single();
  if (!professional) return { error: "El profesional seleccionado ya no está disponible." };

  const { data: requiredDocs } = await admin
    .from("consent_documents")
    .select("id, version")
    .eq("clinic_id", clinic.id)
    .eq("is_active", true)
    .or(`service_id.is.null,service_id.eq.${serviceId}`);

  const requiredIds = (requiredDocs ?? []).map((d) => d.id);
  const missingConsent = requiredIds.some((id) => !acceptedDocumentIds.includes(id));
  if (missingConsent) {
    return { error: "Debes aceptar todas las políticas y consentimientos para continuar." };
  }

  const startsAt = new Date(`${date}T${time}:00`);
  const endsAt = new Date(startsAt.getTime() + service.duration_minutes * 60000);

  if (startsAt.getTime() - Date.now() < service.min_advance_hours * 3600000) {
    return { error: "Ese horario ya no cumple con la anticipación mínima requerida." };
  }

  const { data: hasConflict } = await admin.rpc("has_conflicting_appointment", {
    p_professional_id: professionalId,
    p_starts_at: startsAt.toISOString(),
    p_ends_at: endsAt.toISOString(),
  });
  if (hasConflict) return { error: "Ese horario ya no está disponible. Elige otro." };

  const { data: isBlocked } = await admin.rpc("is_range_blocked", {
    p_professional_id: professionalId,
    p_clinic_id: clinic.id,
    p_starts_at: startsAt.toISOString(),
    p_ends_at: endsAt.toISOString(),
  });
  if (isBlocked) return { error: "Ese horario ya no está disponible. Elige otro." };

  let patientId: string;
  const { data: existingPatient } = email
    ? await admin.from("patients").select("id").eq("clinic_id", clinic.id).eq("email", email).maybeSingle()
    : { data: null };

  if (existingPatient) {
    patientId = existingPatient.id;
  } else {
    const { data: newPatient, error: patientError } = await admin
      .from("patients")
      .insert({
        clinic_id: clinic.id,
        full_name: fullName,
        document_number: documentNumber,
        email,
        phone,
      })
      .select("id")
      .single();
    if (patientError || !newPatient) return { error: "No pudimos registrar tus datos. Intenta de nuevo." };
    patientId = newPatient.id;
  }

  const status: Database["public"]["Enums"]["appointment_status"] = service.requires_payment
    ? paymentProviderKey === "manual_transfer"
      ? "pending_manual_confirmation"
      : "pending_payment"
    : "confirmed";

  const { data: appointment, error: appointmentError } = await admin
    .from("appointments")
    .insert({
      clinic_id: clinic.id,
      patient_id: patientId,
      professional_id: professionalId,
      service_id: serviceId,
      location_id: locationId,
      starts_at: startsAt.toISOString(),
      ends_at: endsAt.toISOString(),
      modality,
      status,
      price: service.price,
      deposit_required: service.deposit_amount ?? 0,
    })
    .select("id, booking_token")
    .single();

  if (appointmentError || !appointment) return { error: "No pudimos crear tu reserva. Intenta de nuevo." };

  const requestHeaders = await headers();
  const userAgent = requestHeaders.get("user-agent");

  if (requiredIds.length > 0) {
    await admin.from("consent_records").insert(
      (requiredDocs ?? []).map((doc) => ({
        clinic_id: clinic.id,
        patient_id: patientId,
        document_id: doc.id,
        document_version: doc.version,
        appointment_id: appointment.id,
        acceptance_method: "web_form" as const,
        user_agent: userAgent,
      })),
    );
  }

  let checkoutUrl: string | undefined;

  if (service.requires_payment) {
    const amount = service.payment_type === "deposit" ? (service.deposit_amount ?? service.price) : service.price;
    let providerRow: Database["public"]["Tables"]["payment_providers"]["Row"] | null = null;
    if (paymentProviderKey) {
      const { data } = await admin
        .from("payment_providers")
        .select("*")
        .eq("clinic_id", clinic.id)
        .eq("provider_key", paymentProviderKey as Database["public"]["Tables"]["payment_providers"]["Row"]["provider_key"])
        .maybeSingle();
      providerRow = data;
    }

    const { data: paymentIntent } = await admin
      .from("payment_intents")
      .insert({
        clinic_id: clinic.id,
        appointment_id: appointment.id,
        patient_id: patientId,
        service_id: serviceId,
        payment_provider_id: providerRow?.id ?? null,
        kind: service.payment_type === "deposit" ? "deposit" : "full",
        amount,
        status: "pending",
      })
      .select("id")
      .single();

    if (providerRow?.provider_key === "wompi" && paymentIntent) {
      const provider = getPaymentProvider(providerRow);
      if (provider?.createCheckoutSession) {
        const session = await provider.createCheckoutSession({
          reference: paymentIntent.id,
          amount,
          currency: "COP",
          redirectUrl: `${process.env.NEXT_PUBLIC_APP_URL}/reserva/${appointment.booking_token}`,
          customerEmail: email,
          customerFullName: fullName,
        });
        checkoutUrl = session.checkoutUrl;
        await admin.from("payment_intents").update({ checkout_url: checkoutUrl }).eq("id", paymentIntent.id);
      }
    }
  }

  // No bloquea la respuesta si el correo falla; queda registrado en
  // notification_logs para poder diagnosticarlo desde el panel.
  if (!checkoutUrl) {
    await notifyAppointment(admin, appointment.id, "appointment_confirmation");
  }

  return { token: appointment.booking_token, checkoutUrl };
}

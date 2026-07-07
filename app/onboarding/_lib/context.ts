import "server-only";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/session";
import type { Database } from "@/lib/supabase/types";

export type OnboardingContext = {
  clinicId: string;
  clinic: Database["public"]["Tables"]["clinics"]["Row"];
  branding: Database["public"]["Tables"]["clinic_branding"]["Row"] | null;
  professionals: Database["public"]["Tables"]["professionals"]["Row"][];
  locations: Database["public"]["Tables"]["clinic_locations"]["Row"][];
  services: Database["public"]["Tables"]["services"]["Row"][];
  availabilityRules: Database["public"]["Tables"]["availability_rules"]["Row"][];
  paymentProviders: Database["public"]["Tables"]["payment_providers"]["Row"][];
  consentDocuments: Database["public"]["Tables"]["consent_documents"]["Row"][];
};

export const getOnboardingContext = cache(async (): Promise<OnboardingContext> => {
  const profile = await requireRole(["clinic_owner"]);
  const supabase = await createClient();
  const clinicId = profile.clinicId!;

  const [
    { data: clinic },
    { data: branding },
    { data: professionals },
    { data: locations },
    { data: services },
    { data: availabilityRules },
    { data: paymentProviders },
    { data: consentDocuments },
  ] = await Promise.all([
    supabase.from("clinics").select("*").eq("id", clinicId).single(),
    supabase.from("clinic_branding").select("*").eq("clinic_id", clinicId).maybeSingle(),
    supabase.from("professionals").select("*").eq("clinic_id", clinicId).is("deleted_at", null),
    supabase.from("clinic_locations").select("*").eq("clinic_id", clinicId).is("deleted_at", null),
    supabase.from("services").select("*").eq("clinic_id", clinicId).is("deleted_at", null),
    supabase.from("availability_rules").select("*").eq("clinic_id", clinicId).is("deleted_at", null),
    supabase.from("payment_providers").select("*").eq("clinic_id", clinicId),
    supabase.from("consent_documents").select("*").eq("clinic_id", clinicId),
  ]);

  if (!clinic) {
    throw new Error("No se encontró el consultorio del usuario actual.");
  }

  return {
    clinicId,
    clinic,
    branding: branding ?? null,
    professionals: professionals ?? [],
    locations: locations ?? [],
    services: services ?? [],
    availabilityRules: availabilityRules ?? [],
    paymentProviders: paymentProviders ?? [],
    consentDocuments: consentDocuments ?? [],
  };
});

export type StepCompletion = Record<number, boolean>;

export function computeStepCompletion(ctx: OnboardingContext): StepCompletion {
  return {
    1: Boolean(ctx.clinic.description && ctx.clinic.contact_phone),
    2: Boolean(ctx.branding?.logo_url),
    3: Boolean(ctx.clinic.primary_practitioner_type),
    4: ctx.professionals.length > 0,
    5: ctx.locations.length > 0,
    6: ctx.services.length > 0,
    7: ctx.availabilityRules.length > 0,
    8: ctx.paymentProviders.some((p) => p.is_active),
    9: ctx.consentDocuments.length > 0,
    10: ctx.services.length > 0 && (ctx.branding?.logo_url ? true : false),
    11: true,
    12: ctx.clinic.is_published,
  };
}

export function progressPercent(completion: StepCompletion): number {
  const values = Object.values(completion);
  const done = values.filter(Boolean).length;
  return Math.round((done / values.length) * 100);
}

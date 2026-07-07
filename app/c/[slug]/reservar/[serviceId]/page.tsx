import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ThemeProvider, type VisualTheme } from "@/components/themes/theme-provider";
import { BookingWizard } from "./booking-wizard";

export default async function BookingPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string; serviceId: string }>;
  searchParams: Promise<{ professional?: string }>;
}) {
  const { slug, serviceId } = await params;
  const { professional: preselectedProfessional } = await searchParams;
  const supabase = await createClient();

  const { data: clinic } = await supabase
    .from("clinics")
    .select("*")
    .eq("slug", slug)
    .eq("is_published", true)
    .is("deleted_at", null)
    .single();
  if (!clinic) notFound();

  const { data: service } = await supabase
    .from("services")
    .select("*")
    .eq("id", serviceId)
    .eq("clinic_id", clinic.id)
    .eq("is_active", true)
    .is("deleted_at", null)
    .single();
  if (!service) notFound();

  const [{ data: branding }, { data: links }, { data: locations }, { data: consentDocs }, { data: paymentProviders }] =
    await Promise.all([
      supabase.from("clinic_branding").select("*").eq("clinic_id", clinic.id).maybeSingle(),
      supabase.from("professional_services").select("professional_id").eq("service_id", serviceId),
      supabase.from("clinic_locations").select("*").eq("clinic_id", clinic.id).eq("is_active", true),
      supabase
        .from("consent_documents")
        .select("*")
        .eq("clinic_id", clinic.id)
        .eq("is_active", true)
        .or(`service_id.is.null,service_id.eq.${serviceId}`),
      supabase.from("payment_providers_public").select("*").eq("clinic_id", clinic.id).eq("is_active", true),
    ]);

  let professionalsQuery = supabase
    .from("professionals")
    .select("*")
    .eq("clinic_id", clinic.id)
    .eq("is_active", true)
    .is("deleted_at", null);

  const linkedIds = (links ?? []).map((l) => l.professional_id);
  if (linkedIds.length > 0) professionalsQuery = professionalsQuery.in("id", linkedIds);

  const { data: professionals } = await professionalsQuery;

  const bookableProviders = (paymentProviders ?? []).filter((p) =>
    ["manual_transfer", "in_person", "wompi"].includes(p.provider_key),
  );

  let manualInstructions: string | null = null;
  const manualProvider = (paymentProviders ?? []).find((p) => p.provider_key === "manual_transfer");
  if (manualProvider) {
    const { data: method } = await supabase
      .from("payment_methods")
      .select("instructions")
      .eq("payment_provider_id", manualProvider.id)
      .eq("is_active", true)
      .maybeSingle();
    manualInstructions = method?.instructions ?? null;
  }

  return (
    <ThemeProvider
      theme={(branding?.visual_theme as VisualTheme) ?? "clinico_moderno"}
      primaryColor={branding?.primary_color}
      secondaryColor={branding?.secondary_color}
      className="min-h-screen bg-background"
    >
      <div className="mx-auto max-w-xl px-4 py-10">
        <BookingWizard
          clinicSlug={slug}
          clinicId={clinic.id}
          service={service}
          professionals={professionals ?? []}
          locations={locations ?? []}
          consentDocuments={consentDocs ?? []}
          paymentProviders={bookableProviders}
          manualTransferInstructions={manualInstructions}
          preselectedProfessionalId={preselectedProfessional}
        />
      </div>
    </ThemeProvider>
  );
}

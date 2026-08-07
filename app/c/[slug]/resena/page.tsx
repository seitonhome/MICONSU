import { notFound } from "next/navigation";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { ThemeProvider, type VisualTheme } from "@/components/themes/theme-provider";
import { ReviewForm } from "./review-form";

export default async function PublicReviewPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ patient?: string }>;
}) {
  const { slug } = await params;
  const { patient: patientId } = await searchParams;
  const supabase = await createClient();

  const { data: clinic } = await supabase
    .from("clinics")
    .select("id, commercial_name")
    .eq("slug", slug)
    .eq("is_published", true)
    .is("deleted_at", null)
    .single();

  if (!clinic) notFound();

  const [{ data: branding }, { data: professionals }] = await Promise.all([
    supabase.from("clinic_branding").select("visual_theme, primary_color, secondary_color, font_style, logo_url").eq("clinic_id", clinic.id).maybeSingle(),
    supabase.from("professionals").select("id, full_name").eq("clinic_id", clinic.id).eq("is_active", true).is("deleted_at", null),
  ]);

  let patientFirstName: string | null = null;
  let validPatientId: string | null = null;
  if (patientId) {
    const admin = createAdminClient();
    const { data: patient } = await admin
      .from("patients")
      .select("id, full_name")
      .eq("id", patientId)
      .eq("clinic_id", clinic.id)
      .maybeSingle();
    if (patient) {
      validPatientId = patient.id;
      patientFirstName = patient.full_name?.split(" ")[0] ?? null;
    }
  }

  return (
    <ThemeProvider
      theme={(branding?.visual_theme as VisualTheme) ?? "clinico_moderno"}
      primaryColor={branding?.primary_color}
      secondaryColor={branding?.secondary_color}
      fontStyle={branding?.font_style}
      className="min-h-screen bg-background"
    >
      <main className="mx-auto max-w-md px-4 py-16">
        <div className="mb-8 text-center">
          {branding?.logo_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={branding.logo_url} alt={clinic.commercial_name} className="mx-auto mb-4 size-16 rounded-2xl object-cover" />
          )}
          <h1 className="text-xl font-semibold">
            {patientFirstName ? `Hola, ${patientFirstName}` : `Tu opinión nos ayuda`}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Cuéntanos cómo fue tu experiencia con {clinic.commercial_name}.
          </p>
        </div>
        <ReviewForm clinicSlug={slug} patientId={validPatientId} professionals={professionals ?? []} />
      </main>
    </ThemeProvider>
  );
}

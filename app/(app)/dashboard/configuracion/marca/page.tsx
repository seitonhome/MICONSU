import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { BrandingForm } from "./branding-form";
import { PublishToggle } from "./publish-toggle";

export default async function MarcaPage() {
  const profile = await requireRole(["clinic_owner"]);
  const supabase = await createClient();

  const [{ data: branding }, { data: clinic }] = await Promise.all([
    supabase.from("clinic_branding").select("*").eq("clinic_id", profile.clinicId!).maybeSingle(),
    supabase.from("clinics").select("commercial_name, slug, is_published").eq("id", profile.clinicId!).single(),
  ]);

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Marca y tema visual</h1>
        <p className="mt-1 text-muted-foreground">
          Tu logo y tema se usan en tu página pública, recordatorios y portal de pacientes.
        </p>
      </div>
      <PublishToggle isPublished={clinic?.is_published ?? false} publicUrl={`${appUrl}/c/${clinic?.slug ?? ""}`} />
      <BrandingForm branding={branding ?? null} commercialName={clinic?.commercial_name ?? ""} />
    </div>
  );
}

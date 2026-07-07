import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { BrandingForm } from "./branding-form";

export default async function MarcaPage() {
  const profile = await requireRole(["clinic_owner"]);
  const supabase = await createClient();

  const { data: branding } = await supabase
    .from("clinic_branding")
    .select("*")
    .eq("clinic_id", profile.clinicId!)
    .maybeSingle();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Marca y tema visual</h1>
        <p className="mt-1 text-muted-foreground">
          Tu logo y tema se usan en tu página pública, recordatorios y portal de pacientes.
        </p>
      </div>
      <BrandingForm branding={branding ?? null} />
    </div>
  );
}

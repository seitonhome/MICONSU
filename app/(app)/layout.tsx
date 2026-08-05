import { requireCurrentProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { DashboardShell } from "@/components/patterns/dashboard-shell";
import { LicenseExpiredScreen } from "@/components/patterns/license-expired-screen";
import { ThemeProvider, type VisualTheme } from "@/components/themes/theme-provider";
import { getClinicEntitlements, planAtLeast, hasModule } from "@/lib/modules";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireCurrentProfile();
  const supabase = await createClient();

  let clinicName = "Tu consultorio";
  let visualTheme: VisualTheme = "clinico_moderno";
  let primaryColor: string | null = null;
  let secondaryColor: string | null = null;
  let navEntitlements = {
    profesionalPlan: false,
    packages: false,
    workshops: false,
    resources: false,
  };
  let licenseBlocked = false;
  let licenseEndsAt: string | null = null;

  if (profile.clinicId) {
    const [{ data: clinic }, { data: branding }, entitlements] = await Promise.all([
      supabase.from("clinics").select("commercial_name").eq("id", profile.clinicId).single(),
      supabase
        .from("clinic_branding")
        .select("visual_theme, primary_color, secondary_color")
        .eq("clinic_id", profile.clinicId)
        .single(),
      getClinicEntitlements(profile.clinicId),
    ]);
    clinicName = clinic?.commercial_name ?? clinicName;
    visualTheme = (branding?.visual_theme as VisualTheme) ?? visualTheme;
    primaryColor = branding?.primary_color ?? null;
    secondaryColor = branding?.secondary_color ?? null;
    navEntitlements = {
      profesionalPlan: planAtLeast(entitlements, "profesional"),
      packages: hasModule(entitlements, "advanced_therapeutic_packages"),
      workshops: hasModule(entitlements, "group_workshops"),
      resources: hasModule(entitlements, "digital_resources"),
    };
    // Plan anual vencido/suspendido/cancelado: se bloquea la operación del
    // sistema, nunca el acceso a los propios datos (ver getClinicEntitlements
    // y app/api/export/clinic-data). No bloquea si simplemente no hay fila de
    // licencia (edge case, no debería pasar en un consultorio real).
    licenseBlocked = entitlements.licenseType !== null && !entitlements.licenseActive;
    licenseEndsAt = entitlements.licenseEndsAt;
  }

  if (licenseBlocked) {
    return (
      <ThemeProvider theme={visualTheme} primaryColor={primaryColor} secondaryColor={secondaryColor} className="contents">
        <LicenseExpiredScreen clinicName={clinicName} isOwner={profile.role === "clinic_owner"} endsAt={licenseEndsAt} />
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider
      theme={visualTheme}
      primaryColor={primaryColor}
      secondaryColor={secondaryColor}
      className="contents"
    >
      <DashboardShell
        clinicName={clinicName}
        role={profile.role}
        fullName={profile.fullName || "Sin nombre"}
        entitlements={navEntitlements}
      >
        {children}
      </DashboardShell>
    </ThemeProvider>
  );
}

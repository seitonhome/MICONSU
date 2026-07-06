import { requireCurrentProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { DashboardShell } from "@/components/patterns/dashboard-shell";
import { ThemeProvider, type VisualTheme } from "@/components/themes/theme-provider";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireCurrentProfile();
  const supabase = await createClient();

  let clinicName = "Tu consultorio";
  let visualTheme: VisualTheme = "clinico_moderno";
  let primaryColor: string | null = null;
  let secondaryColor: string | null = null;

  if (profile.clinicId) {
    const [{ data: clinic }, { data: branding }] = await Promise.all([
      supabase.from("clinics").select("commercial_name").eq("id", profile.clinicId).single(),
      supabase
        .from("clinic_branding")
        .select("visual_theme, primary_color, secondary_color")
        .eq("clinic_id", profile.clinicId)
        .single(),
    ]);
    clinicName = clinic?.commercial_name ?? clinicName;
    visualTheme = (branding?.visual_theme as VisualTheme) ?? visualTheme;
    primaryColor = branding?.primary_color ?? null;
    secondaryColor = branding?.secondary_color ?? null;
  }

  return (
    <ThemeProvider
      theme={visualTheme}
      primaryColor={primaryColor}
      secondaryColor={secondaryColor}
      className="contents"
    >
      <DashboardShell clinicName={clinicName} role={profile.role} fullName={profile.fullName || "Sin nombre"}>
        {children}
      </DashboardShell>
    </ThemeProvider>
  );
}

import { redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { ThemeProvider } from "@/components/themes/theme-provider";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Tu portal — Mi Consultorio Pro",
};

export default async function PortalIndexPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/portal/login");

  const { data: patients } = await supabase
    .from("patients")
    .select("id, clinic_id")
    .eq("user_id", user.id)
    .is("deleted_at", null);

  if (!patients || patients.length === 0) {
    return (
      <ThemeProvider theme="clinico_moderno" className="min-h-screen bg-muted/30">
        <div className="mx-auto max-w-md space-y-3 px-4 py-20 text-center">
          <h1 className="text-xl font-semibold">Aún no tienes citas registradas con este correo</h1>
          <p className="text-sm text-muted-foreground">
            Cuando reserves tu primera cita usando este correo, aparecerá aquí automáticamente.
          </p>
        </div>
      </ThemeProvider>
    );
  }

  if (patients.length === 1) {
    redirect(`/portal/${patients[0].id}`);
  }

  const clinicIds = Array.from(new Set(patients.map((p) => p.clinic_id)));
  const { data: clinics } = await supabase.from("clinics").select("id, commercial_name").in("id", clinicIds);
  const clinicById = new Map((clinics ?? []).map((c) => [c.id, c.commercial_name]));

  return (
    <ThemeProvider theme="clinico_moderno" className="min-h-screen bg-muted/30">
      <div className="mx-auto max-w-md space-y-4 px-4 py-16">
        <h1 className="text-xl font-semibold">Elige tu consultorio</h1>
        <p className="text-sm text-muted-foreground">Tienes historial en más de un consultorio con este correo.</p>
        <div className="space-y-2">
          {patients.map((p) => (
            <Button
              key={p.id}
              variant="outline"
              className="w-full justify-start"
              render={<Link href={`/portal/${p.id}`} />}
            >
              {clinicById.get(p.clinic_id) ?? "Consultorio"}
            </Button>
          ))}
        </div>
      </div>
    </ThemeProvider>
  );
}

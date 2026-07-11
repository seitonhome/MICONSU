import { redirect } from "next/navigation";
import Link from "next/link";
import { headers } from "next/headers";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import type { Database } from "@/lib/supabase/types";

const VALID_VERTICALS = ["medico", "odontologo", "psicologo", "alternativa", "bienestar"] as const;
type VerticalKey = Database["public"]["Tables"]["demo_data_profiles"]["Row"]["vertical_key"];

function isValidVertical(v: string): v is VerticalKey {
  return (VALID_VERTICALS as readonly string[]).includes(v);
}

const VERTICAL_LABELS: Record<string, string> = {
  medico: "Médicos",
  odontologo: "Odontólogos",
  psicologo: "Psicólogos y psiquiatras",
  alternativa: "Medicina alternativa",
  bienestar: "Bienestar",
};

export default async function DemoVerticalPage({ params }: { params: Promise<{ vertical: string }> }) {
  const { vertical } = await params;
  const supabase = await createClient();

  const { data: profile } = isValidVertical(vertical)
    ? await supabase
        .from("demo_data_profiles")
        .select("clinic_id, display_name")
        .eq("vertical_key", vertical)
        .eq("is_active", true)
        .maybeSingle()
    : { data: null };

  if (!profile) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
        <h1 className="text-2xl font-semibold">
          La demo de {VERTICAL_LABELS[vertical] ?? vertical} está en camino
        </h1>
        <p className="max-w-md text-muted-foreground">
          Por ahora puedes ver el sistema completo funcionando en nuestra demo de medicina alternativa.
        </p>
        <div className="flex gap-3">
          <Button render={<Link href="/demo/alternativa" />}>Ver demo de medicina alternativa</Button>
          <Button variant="outline" render={<Link href="/register" />}>
            Crear mi consultorio
          </Button>
        </div>
      </div>
    );
  }

  const { data: clinic } = await supabase.from("clinics").select("slug").eq("id", profile.clinic_id).single();

  if (clinic) {
    const admin = createAdminClient();
    const requestHeaders = await headers();
    await admin.from("sales_demo_sessions").insert({
      vertical_key: vertical,
      referrer: requestHeaders.get("referer"),
    });
    redirect(`/c/${clinic.slug}`);
  }

  redirect("/");
}

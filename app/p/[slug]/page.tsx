import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ThemeProvider, type VisualTheme } from "@/components/themes/theme-provider";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PRACTITIONER_TYPE_LABELS } from "@/lib/auth/roles";
import { MODALITY_LABELS } from "@/lib/domain/labels";

export default async function ProfessionalPublicPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: professional } = await supabase
    .from("professionals")
    .select("*")
    .eq("slug", slug)
    .eq("is_active", true)
    .is("deleted_at", null)
    .single();

  if (!professional) notFound();

  const { data: clinic } = await supabase
    .from("clinics")
    .select("*")
    .eq("id", professional.clinic_id)
    .eq("is_published", true)
    .is("deleted_at", null)
    .single();

  if (!clinic) notFound();

  const [{ data: branding }, { data: links }, { data: credentials }] = await Promise.all([
    supabase.from("clinic_branding").select("*").eq("clinic_id", clinic.id).maybeSingle(),
    supabase.from("professional_services").select("service_id").eq("professional_id", professional.id),
    supabase
      .from("professional_credentials")
      .select("*")
      .eq("professional_id", professional.id)
      .eq("is_public", true)
      .eq("is_verified", true),
  ]);

  let servicesQuery = supabase
    .from("services")
    .select("*")
    .eq("clinic_id", clinic.id)
    .eq("is_active", true)
    .is("deleted_at", null);

  const linkedServiceIds = (links ?? []).map((l) => l.service_id);
  if (linkedServiceIds.length > 0) {
    servicesQuery = servicesQuery.in("id", linkedServiceIds);
  }

  const { data: services } = await servicesQuery;

  return (
    <ThemeProvider
      theme={(branding?.visual_theme as VisualTheme) ?? "clinico_moderno"}
      primaryColor={branding?.primary_color}
      secondaryColor={branding?.secondary_color}
      className="min-h-screen bg-background"
    >
      <header className="border-b bg-background">
        <div className="mx-auto max-w-2xl px-4 py-10 text-center">
          <Avatar size="lg" className="mx-auto size-24">
            <AvatarImage src={professional.photo_url ?? undefined} alt={professional.full_name} />
            <AvatarFallback className="text-lg">{professional.full_name.slice(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          <h1 className="mt-4 text-2xl font-semibold">{professional.full_name}</h1>
          <p className="mt-1 text-muted-foreground">
            {professional.specialty_label || PRACTITIONER_TYPE_LABELS[professional.practitioner_type]}
          </p>
          {professional.bio && <p className="mx-auto mt-4 max-w-lg text-sm text-muted-foreground">{professional.bio}</p>}
          <p className="mt-2 text-xs text-muted-foreground">
            En <Link href={`/c/${clinic.slug}`} className="underline underline-offset-4">{clinic.commercial_name}</Link>
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-2xl space-y-10 px-4 py-10">
        {credentials && credentials.length > 0 && (
          <section>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Formación y credenciales</h2>
            <ul className="space-y-1 text-sm">
              {credentials.map((c) => (
                <li key={c.id}>
                  {c.title}
                  {c.issuing_entity ? ` — ${c.issuing_entity}` : ""}
                </li>
              ))}
            </ul>
          </section>
        )}

        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Servicios</h2>
          {!services || services.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aún no hay servicios publicados.</p>
          ) : (
            <ul className="divide-y rounded-xl border">
              {services.map((s) => (
                <li key={s.id} className="flex items-center justify-between gap-4 px-4 py-4">
                  <div className="min-w-0">
                    <p className="font-medium">{s.name}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {s.duration_minutes} min · {MODALITY_LABELS[s.modality]}
                      {s.price_visible && s.price > 0 ? ` · $${Number(s.price).toLocaleString("es-CO")}` : ""}
                    </p>
                  </div>
                  <Button render={<Link href={`/c/${clinic.slug}/reservar/${s.id}?professional=${professional.id}`} />}>
                    Reservar
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </ThemeProvider>
  );
}

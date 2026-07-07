import { notFound } from "next/navigation";
import Link from "next/link";
import { MapPin, Phone, MessageCircle, Globe } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { ThemeProvider, type VisualTheme } from "@/components/themes/theme-provider";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PRACTITIONER_TYPE_LABELS } from "@/lib/auth/roles";
import { MODALITY_LABELS } from "@/lib/domain/labels";

export default async function ClinicPublicPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: clinic } = await supabase
    .from("clinics")
    .select("*")
    .eq("slug", slug)
    .eq("is_published", true)
    .is("deleted_at", null)
    .single();

  if (!clinic) notFound();

  const [{ data: branding }, { data: professionals }, { data: locations }, { data: categories }, { data: services }] =
    await Promise.all([
      supabase.from("clinic_branding").select("*").eq("clinic_id", clinic.id).maybeSingle(),
      supabase
        .from("professionals")
        .select("*")
        .eq("clinic_id", clinic.id)
        .eq("is_active", true)
        .is("deleted_at", null),
      supabase
        .from("clinic_locations")
        .select("*")
        .eq("clinic_id", clinic.id)
        .eq("is_active", true)
        .is("deleted_at", null),
      supabase.from("service_categories").select("*").eq("clinic_id", clinic.id).is("deleted_at", null).order("sort_order"),
      supabase
        .from("services")
        .select("*")
        .eq("clinic_id", clinic.id)
        .eq("is_active", true)
        .is("deleted_at", null),
    ]);

  const svcs = services ?? [];
  const cats = categories ?? [];
  const uncategorized = svcs.filter((s) => !s.category_id);

  return (
    <ThemeProvider
      theme={(branding?.visual_theme as VisualTheme) ?? "clinico_moderno"}
      primaryColor={branding?.primary_color}
      secondaryColor={branding?.secondary_color}
      className="min-h-screen bg-background"
    >
      <header className="border-b bg-background">
        <div className="mx-auto max-w-3xl px-4 py-10 text-center">
          {branding?.logo_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={branding.logo_url} alt={clinic.commercial_name} className="mx-auto mb-4 size-20 rounded-2xl object-cover" />
          )}
          <h1 className="text-3xl font-semibold tracking-tight">{clinic.commercial_name}</h1>
          {clinic.description && <p className="mt-3 text-muted-foreground">{clinic.description}</p>}
          <div className="mt-5 flex flex-wrap items-center justify-center gap-3 text-sm text-muted-foreground">
            {clinic.contact_phone && (
              <span className="flex items-center gap-1">
                <Phone className="size-4" /> {clinic.contact_phone}
              </span>
            )}
            {clinic.whatsapp_number && (
              <a
                href={`https://wa.me/${clinic.whatsapp_number.replace(/\D/g, "")}`}
                target="_blank"
                className="flex items-center gap-1 hover:text-foreground"
              >
                <MessageCircle className="size-4" /> WhatsApp
              </a>
            )}
            {clinic.website_url && (
              <a href={clinic.website_url} target="_blank" className="flex items-center gap-1 hover:text-foreground">
                <Globe className="size-4" /> Sitio web
              </a>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-12 px-4 py-10">
        {professionals && professionals.length > 0 && (
          <section>
            <h2 className="mb-4 text-lg font-semibold">Nuestro equipo</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {professionals.map((p) => (
                <Link
                  key={p.id}
                  href={`/p/${p.slug}`}
                  className="flex items-center gap-3 rounded-xl border p-4 transition-colors hover:border-primary"
                >
                  <Avatar className="size-12">
                    <AvatarImage src={p.photo_url ?? undefined} alt={p.full_name} />
                    <AvatarFallback>{p.full_name.slice(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="truncate font-medium">{p.full_name}</p>
                    <p className="truncate text-sm text-muted-foreground">
                      {p.specialty_label || PRACTITIONER_TYPE_LABELS[p.practitioner_type]}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        <section>
          <h2 className="mb-4 text-lg font-semibold">Servicios</h2>
          {svcs.length === 0 ? (
            <p className="text-sm text-muted-foreground">Este consultorio aún no tiene servicios publicados.</p>
          ) : (
            <div className="space-y-8">
              {cats.map((cat) => {
                const items = svcs.filter((s) => s.category_id === cat.id);
                if (items.length === 0) return null;
                return <ServiceList key={cat.id} title={cat.name} services={items} slug={slug} />;
              })}
              {uncategorized.length > 0 && <ServiceList title="Otros servicios" services={uncategorized} slug={slug} />}
            </div>
          )}
        </section>

        {locations && locations.length > 0 && (
          <section>
            <h2 className="mb-4 text-lg font-semibold">Sedes</h2>
            <ul className="space-y-3">
              {locations.map((loc) => (
                <li key={loc.id} className="flex items-start gap-2 text-sm">
                  <MapPin className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{loc.name}</p>
                    <p className="text-muted-foreground">
                      {loc.is_virtual ? "Modalidad virtual" : [loc.address, loc.city].filter(Boolean).join(", ")}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}

        {clinic.legal_disclaimer && (
          <section className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
            {clinic.legal_disclaimer}
          </section>
        )}
      </main>
    </ThemeProvider>
  );
}

function ServiceList({
  title,
  services,
  slug,
}: {
  title: string;
  services: {
    id: string;
    name: string;
    description: string | null;
    duration_minutes: number;
    price: number;
    price_visible: boolean;
    modality: "in_person" | "virtual" | "both";
  }[];
  slug: string;
}) {
  return (
    <div>
      <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">{title}</h3>
      <ul className="divide-y rounded-xl border">
        {services.map((s) => (
          <li key={s.id} className="flex items-center justify-between gap-4 px-4 py-4">
            <div className="min-w-0">
              <p className="font-medium">{s.name}</p>
              {s.description && <p className="mt-0.5 text-sm text-muted-foreground">{s.description}</p>}
              <p className="mt-1 text-xs text-muted-foreground">
                {s.duration_minutes} min · {MODALITY_LABELS[s.modality]}
                {s.price_visible && s.price > 0 ? ` · $${Number(s.price).toLocaleString("es-CO")}` : ""}
              </p>
            </div>
            <Button render={<Link href={`/c/${slug}/reservar/${s.id}`} />} className="shrink-0">
              Reservar
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
}

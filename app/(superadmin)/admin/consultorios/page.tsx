import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { LICENSE_STATUS_LABELS } from "@/lib/domain/labels";

export default async function ConsultoriosPage() {
  const supabase = await createClient();

  const { data: clinics } = await supabase
    .from("clinics")
    .select("*")
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  const clinicIds = (clinics ?? []).map((c) => c.id);
  const { data: licenses } = clinicIds.length > 0
    ? await supabase.from("licenses").select("*").in("clinic_id", clinicIds)
    : { data: [] as { clinic_id: string; status: string; license_type: string }[] };

  const licenseByClinic = new Map((licenses ?? []).map((l) => [l.clinic_id, l]));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Consultorios</h1>
        <p className="mt-1 text-muted-foreground">Todos los consultorios registrados en la plataforma.</p>
      </div>

      <ul className="divide-y rounded-xl border bg-background">
        {(clinics ?? []).map((clinic) => {
          const license = licenseByClinic.get(clinic.id);
          return (
            <li key={clinic.id}>
              <Link
                href={`/admin/consultorios/${clinic.id}`}
                className="flex items-center justify-between gap-4 px-4 py-3 hover:bg-muted/50"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{clinic.commercial_name}</p>
                  <p className="text-xs text-muted-foreground">
                    /{clinic.slug} · {clinic.is_published ? "Publicado" : "No publicado"}
                    {clinic.is_demo ? " · Demo" : ""}
                  </p>
                </div>
                <Badge variant={license?.status === "active" ? "secondary" : "outline"}>
                  {license ? (LICENSE_STATUS_LABELS[license.status] ?? license.status) : "Sin licencia"}
                </Badge>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

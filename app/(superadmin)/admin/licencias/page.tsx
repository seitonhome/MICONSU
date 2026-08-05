import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { LICENSE_STATUS_LABELS } from "@/lib/domain/labels";

const LICENSE_TYPE_LABELS: Record<string, string> = {
  esencial: "Esencial",
  profesional: "Profesional",
  centro: "Centro",
};

export default async function AdminLicenciasPage() {
  const supabase = await createClient();

  const { data: licenses } = await supabase.from("licenses").select("*").order("purchased_at", { ascending: false });

  const clinicIds = Array.from(new Set((licenses ?? []).map((l) => l.clinic_id)));
  const { data: clinics } = clinicIds.length > 0
    ? await supabase.from("clinics").select("id, commercial_name, slug").in("id", clinicIds)
    : { data: [] as { id: string; commercial_name: string; slug: string }[] };
  const clinicById = new Map((clinics ?? []).map((c) => [c.id, c]));

  const counts = {
    active: (licenses ?? []).filter((l) => l.status === "active").length,
    trial: (licenses ?? []).filter((l) => l.status === "trial").length,
    expired: (licenses ?? []).filter((l) => l.status === "expired" || l.status === "suspended" || l.status === "cancelled")
      .length,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Licencias</h1>
        <p className="mt-1 text-muted-foreground">Estado de licencia de todos los consultorios de la plataforma.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border bg-background p-4">
          <p className="text-2xl font-semibold">{counts.active}</p>
          <p className="text-sm text-muted-foreground">Activas</p>
        </div>
        <div className="rounded-xl border bg-background p-4">
          <p className="text-2xl font-semibold">{counts.trial}</p>
          <p className="text-sm text-muted-foreground">En prueba</p>
        </div>
        <div className="rounded-xl border bg-background p-4">
          <p className="text-2xl font-semibold">{counts.expired}</p>
          <p className="text-sm text-muted-foreground">Vencidas, suspendidas o canceladas</p>
        </div>
      </div>

      {!licenses || licenses.length === 0 ? (
        <p className="text-sm text-muted-foreground">Ningún consultorio tiene licencia registrada todavía.</p>
      ) : (
        <ul className="divide-y rounded-xl border bg-background">
          {licenses.map((l) => {
            const clinic = clinicById.get(l.clinic_id);
            return (
              <li key={l.clinic_id}>
                <Link
                  href={`/admin/consultorios/${l.clinic_id}`}
                  className="flex items-center justify-between gap-4 px-4 py-3 hover:bg-muted/50"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{clinic?.commercial_name ?? "Consultorio"}</p>
                    <p className="text-xs text-muted-foreground">
                      {LICENSE_TYPE_LABELS[l.license_type] ?? l.license_type} · {l.professionals_allowed} profesional(es) ·{" "}
                      {l.locations_allowed} sede(s)
                      {l.ends_at && (
                        <>
                          {" "}
                          · Vence: {new Date(l.ends_at).toLocaleDateString("es-CO")}
                        </>
                      )}
                    </p>
                  </div>
                  <Badge variant={l.status === "active" ? "default" : "outline"}>
                    {LICENSE_STATUS_LABELS[l.status] ?? l.status}
                  </Badge>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

import { ShieldCheck } from "lucide-react";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { ConsentDialog } from "./consent-dialog";
import { ConsentActiveToggle } from "./consent-active-toggle";
import { CONSENT_TEMPLATES } from "@/lib/templates/consent-templates";

export default async function ConsentimientosPage() {
  const profile = await requireRole(["clinic_owner"]);
  const supabase = await createClient();

  const [{ data: documents }, { data: services }] = await Promise.all([
    supabase.from("consent_documents").select("*").eq("clinic_id", profile.clinicId!).order("created_at"),
    supabase.from("services").select("id, name").eq("clinic_id", profile.clinicId!).is("deleted_at", null),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Consentimientos y legal</h1>
          <p className="mt-1 text-muted-foreground">
            Documentos que tus pacientes deben aceptar antes de reservar. Cada edición crea una nueva versión.
          </p>
        </div>
        <ConsentDialog services={services ?? []} />
      </div>

      {!documents || documents.length === 0 ? (
        <div className="rounded-2xl border border-dashed p-10 text-center">
          <ShieldCheck className="mx-auto size-8 text-muted-foreground" />
          <p className="mt-3 font-medium">Aún no tienes documentos legales activos.</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Revisa tu política de datos y consentimientos antes de publicar tu página.
          </p>
        </div>
      ) : (
        <ul className="divide-y rounded-xl border">
          {documents.map((doc) => (
            <li key={doc.id} className="flex items-center justify-between gap-4 px-4 py-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="truncate text-sm font-medium">{doc.title}</p>
                  <Badge variant="outline">v{doc.version}</Badge>
                </div>
                <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                  {CONSENT_TEMPLATES[doc.document_type]?.title ?? doc.document_type}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <ConsentActiveToggle id={doc.id} isActive={doc.is_active} />
                <ConsentDialog document={doc} services={services ?? []} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

import { Library, ExternalLink } from "lucide-react";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { getClinicEntitlements, planAtLeast, hasModule } from "@/lib/modules";
import { ModuleLocked } from "@/components/patterns/module-locked";
import { ResourceDialog } from "./resource-dialog";
import { AssignDialog } from "./assign-dialog";
import { DeactivateButton } from "./deactivate-button";

const TYPE_LABELS: Record<string, string> = {
  pdf: "PDF",
  audio: "Audio",
  video: "Video",
  guide: "Guía",
  exercise: "Ejercicio",
  other: "Otro",
};

export default async function RecursosPage() {
  const profile = await requireRole(["clinic_owner", "assistant", "professional"]);
  const supabase = await createClient();

  const entitlements = await getClinicEntitlements(profile.clinicId!);
  if (!planAtLeast(entitlements, "profesional") || !hasModule(entitlements, "digital_resources")) {
    return (
      <ModuleLocked
        title="La biblioteca de recursos es un módulo adicional."
        requiredPlan="profesional"
        moduleLabel="Recursos digitales"
      />
    );
  }

  const [{ data: resources }, { data: patients }] = await Promise.all([
    supabase
      .from("resource_library")
      .select("*")
      .eq("clinic_id", profile.clinicId!)
      .is("deleted_at", null)
      .eq("is_active", true)
      .order("created_at", { ascending: false }),
    supabase.from("patients").select("*").eq("clinic_id", profile.clinicId!).order("full_name"),
  ]);

  const resourcesWithUrls = await Promise.all(
    (resources ?? []).map(async (r) => {
      const { data } = await supabase.storage.from("clinical-documents").createSignedUrl(r.file_url, 3600);
      return { ...r, signedUrl: data?.signedUrl ?? null };
    }),
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Biblioteca de recursos</h1>
          <p className="mt-1 text-muted-foreground">
            Sube material educativo y envíalo a tus pacientes después de una sesión.
          </p>
        </div>
        <ResourceDialog />
      </div>

      {resourcesWithUrls.length === 0 ? (
        <div className="rounded-2xl border border-dashed p-10 text-center">
          <Library className="mx-auto size-8 text-muted-foreground" />
          <p className="mt-3 font-medium">Aún no tienes recursos en tu biblioteca.</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Sube PDFs, audios, videos o guías para enviar a tus pacientes después de una sesión.
          </p>
        </div>
      ) : (
        <ul className="divide-y rounded-xl border">
          {resourcesWithUrls.map((r) => (
            <li key={r.id} className="flex items-center justify-between gap-4 px-4 py-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  {r.signedUrl ? (
                    <a
                      href={r.signedUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="truncate text-sm font-medium underline-offset-2 hover:underline"
                    >
                      {r.title}
                    </a>
                  ) : (
                    <p className="truncate text-sm font-medium">{r.title}</p>
                  )}
                  <Badge variant="outline">{TYPE_LABELS[r.resource_type]}</Badge>
                </div>
                {r.description && <p className="mt-0.5 truncate text-xs text-muted-foreground">{r.description}</p>}
              </div>
              <div className="flex shrink-0 items-center gap-1">
                {r.signedUrl && (
                  <a href={r.signedUrl} target="_blank" rel="noreferrer" aria-label="Abrir archivo">
                    <ExternalLink className="size-4 text-muted-foreground" />
                  </a>
                )}
                <AssignDialog resourceId={r.id} patients={patients ?? []} />
                <DeactivateButton id={r.id} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

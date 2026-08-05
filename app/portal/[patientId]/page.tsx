import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { CalendarCheck, FileText, Package, Receipt, ShieldCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { ThemeProvider, type VisualTheme } from "@/components/themes/theme-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { APPOINTMENT_STATUS_LABELS, PAYMENT_STATUS_LABELS } from "@/lib/domain/labels";
import type { Database } from "@/lib/supabase/types";

const PACKAGE_STATUS_LABELS: Record<string, string> = {
  active: "Activo",
  completed: "Completado",
  paused: "Pausado",
  expired: "Vencido",
  cancelled: "Cancelado",
};

export default async function PortalPatientPage({ params }: { params: Promise<{ patientId: string }> }) {
  const { patientId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/portal/login");

  const { data: patient } = await supabase
    .from("patients")
    .select("*")
    .eq("id", patientId)
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .maybeSingle();

  if (!patient) notFound();

  const [{ data: clinic }, { data: branding }, { data: appointments }, { data: packages }, { data: consentRecords }, { data: assignedResources }, { data: paymentIntents }] =
    await Promise.all([
      supabase.from("clinics").select("*").eq("id", patient.clinic_id).single(),
      supabase.from("clinic_branding").select("*").eq("clinic_id", patient.clinic_id).maybeSingle(),
      supabase
        .from("appointments")
        .select("*")
        .eq("patient_id", patientId)
        .order("starts_at", { ascending: false }),
      supabase
        .from("session_packages")
        .select("*")
        .eq("patient_id", patientId)
        .order("created_at", { ascending: false }),
      supabase
        .from("consent_records")
        .select("*")
        .eq("patient_id", patientId)
        .order("accepted_at", { ascending: false }),
      supabase
        .from("assigned_resources")
        .select("*")
        .eq("patient_id", patientId)
        .order("assigned_at", { ascending: false }),
      supabase
        .from("payment_intents")
        .select("*")
        .eq("patient_id", patientId)
        .order("created_at", { ascending: false }),
    ]);

  const serviceIds = Array.from(new Set((appointments ?? []).map((a) => a.service_id)));
  const professionalIds = Array.from(new Set((appointments ?? []).map((a) => a.professional_id)));
  const consentDocIds = Array.from(new Set((consentRecords ?? []).map((c) => c.document_id)));
  const resourceIds = Array.from(new Set((assignedResources ?? []).map((r) => r.resource_id)));
  const intentIds = (paymentIntents ?? []).map((i) => i.id);

  const [{ data: services }, { data: professionals }, { data: consentDocs }, { data: resourceRows }, { data: payments }] =
    await Promise.all([
      serviceIds.length > 0
        ? supabase.from("services").select("id, name").in("id", serviceIds)
        : Promise.resolve({ data: [] as { id: string; name: string }[] }),
      professionalIds.length > 0
        ? supabase.from("professionals").select("id, full_name").in("id", professionalIds)
        : Promise.resolve({ data: [] as { id: string; full_name: string }[] }),
      consentDocIds.length > 0
        ? supabase.from("consent_documents").select("id, title").in("id", consentDocIds)
        : Promise.resolve({ data: [] as { id: string; title: string }[] }),
      resourceIds.length > 0
        ? supabase.from("resource_library").select("id, title, file_url").in("id", resourceIds)
        : Promise.resolve({ data: [] as { id: string; title: string; file_url: string }[] }),
      intentIds.length > 0
        ? supabase.from("payments").select("*").in("payment_intent_id", intentIds).order("created_at", { ascending: false })
        : Promise.resolve({ data: [] as Database["public"]["Tables"]["payments"]["Row"][] }),
    ]);

  const serviceById = new Map((services ?? []).map((s) => [s.id, s.name]));
  const professionalById = new Map((professionals ?? []).map((p) => [p.id, p.full_name]));
  const consentDocById = new Map((consentDocs ?? []).map((d) => [d.id, d.title]));
  const resourceById = new Map((resourceRows ?? []).map((r) => [r.id, r]));

  const now = Date.now();
  const upcoming = (appointments ?? [])
    .filter((a) => !["cancelled", "completed", "no_show", "expired"].includes(a.status) && new Date(a.starts_at).getTime() >= now)
    .sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime());
  const nextAppointment = upcoming[0] ?? null;
  const history = (appointments ?? []).filter((a) => a.id !== nextAppointment?.id);

  const activePackage = (packages ?? []).find((p) => p.status === "active") ?? null;

  const resourcesWithUrls = await Promise.all(
    (assignedResources ?? []).map(async (ar) => {
      const resource = resourceById.get(ar.resource_id);
      if (!resource) return null;
      const { data } = await supabase.storage.from("clinical-documents").createSignedUrl(resource.file_url, 3600);
      return { id: ar.id, title: resource.title, signedUrl: data?.signedUrl ?? null };
    }),
  );
  const resources = resourcesWithUrls.filter((r): r is NonNullable<typeof r> => r !== null);

  return (
    <ThemeProvider
      theme={(branding?.visual_theme as VisualTheme) ?? "clinico_moderno"}
      primaryColor={branding?.primary_color}
      secondaryColor={branding?.secondary_color}
      className="min-h-screen bg-muted/30"
    >
      <div className="mx-auto max-w-2xl space-y-6 px-4 py-10">
        <div>
          <p className="text-sm text-muted-foreground">{clinic?.commercial_name}</p>
          <h1 className="text-2xl font-semibold">Hola, {patient.full_name.split(" ")[0]}</h1>
        </div>

        <section className="rounded-xl border bg-background p-4">
          <div className="mb-3 flex items-center gap-2 font-medium">
            <CalendarCheck className="size-4" /> Próxima cita
          </div>
          {nextAppointment ? (
            <div className="space-y-1 text-sm">
              <div className="flex items-center justify-between">
                <p className="font-medium">{serviceById.get(nextAppointment.service_id) ?? "Servicio"}</p>
                <Badge>{APPOINTMENT_STATUS_LABELS[nextAppointment.status]}</Badge>
              </div>
              <p className="text-muted-foreground">
                {new Date(nextAppointment.starts_at).toLocaleDateString("es-CO", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                })}{" "}
                ·{" "}
                {new Date(nextAppointment.starts_at).toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" })}
              </p>
              <p className="text-muted-foreground">Con {professionalById.get(nextAppointment.professional_id) ?? "tu profesional"}</p>
              <Button variant="link" className="h-auto px-0" render={<Link href={`/reserva/${nextAppointment.booking_token}`} />}>
                Reprogramar o cancelar
              </Button>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No tienes una próxima cita.{" "}
              <Link href={`/c/${clinic?.slug}`} className="font-medium underline underline-offset-4">
                Reserva tu próxima sesión
              </Link>
              .
            </p>
          )}
        </section>

        {activePackage && (
          <section className="rounded-xl border bg-background p-4">
            <div className="mb-3 flex items-center gap-2 font-medium">
              <Package className="size-4" /> Tu paquete activo
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <p className="font-medium">{activePackage.name}</p>
                <Badge variant="secondary">{PACKAGE_STATUS_LABELS[activePackage.status]}</Badge>
              </div>
              <Progress value={(activePackage.sessions_used / activePackage.total_sessions) * 100} />
              <p className="text-muted-foreground">
                {activePackage.sessions_used} de {activePackage.total_sessions} sesiones usadas ·{" "}
                {activePackage.total_sessions - activePackage.sessions_used} restantes
              </p>
            </div>
          </section>
        )}

        {resources.length > 0 && (
          <section className="rounded-xl border bg-background p-4">
            <div className="mb-3 flex items-center gap-2 font-medium">
              <FileText className="size-4" /> Recursos enviados
            </div>
            <ul className="space-y-2 text-sm">
              {resources.map((r) => (
                <li key={r.id} className="flex items-center justify-between gap-2">
                  <span>{r.title}</span>
                  {r.signedUrl && (
                    <a
                      href={r.signedUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs font-medium underline underline-offset-4"
                    >
                      Ver
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="rounded-xl border bg-background p-4">
          <div className="mb-3 flex items-center gap-2 font-medium">
            <Receipt className="size-4" /> Pagos
          </div>
          {(payments ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">Aún no tienes pagos registrados.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {(payments ?? []).map((p) => (
                <li key={p.id} className="flex items-center justify-between">
                  <span>
                    ${p.amount.toLocaleString("es-CO")} {p.currency}
                  </span>
                  <Badge variant="outline">{PAYMENT_STATUS_LABELS[p.status]}</Badge>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-xl border bg-background p-4">
          <div className="mb-3 flex items-center gap-2 font-medium">
            <ShieldCheck className="size-4" /> Consentimientos aceptados
          </div>
          {(consentRecords ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">No tienes consentimientos registrados.</p>
          ) : (
            <ul className="space-y-1 text-sm">
              {(consentRecords ?? []).map((c) => (
                <li key={c.id} className="flex items-center justify-between text-muted-foreground">
                  <span>{consentDocById.get(c.document_id) ?? "Documento"}</span>
                  <span>{new Date(c.accepted_at).toLocaleDateString("es-CO")}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        {history.length > 0 && (
          <section className="rounded-xl border bg-background p-4">
            <div className="mb-3 font-medium">Historial de citas</div>
            <ul className="space-y-2 text-sm">
              {history.map((a) => (
                <li key={a.id} className="flex items-center justify-between">
                  <div>
                    <p>{serviceById.get(a.service_id) ?? "Servicio"}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(a.starts_at).toLocaleDateString("es-CO", { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                  </div>
                  <Badge variant="outline">{APPOINTMENT_STATUS_LABELS[a.status]}</Badge>
                </li>
              ))}
            </ul>
          </section>
        )}

        <div className="text-center">
          <Button variant="link" render={<Link href={`/c/${clinic?.slug}`} />}>
            Ver servicios de {clinic?.commercial_name}
          </Button>
        </div>
      </div>
    </ThemeProvider>
  );
}

import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ShieldAlert } from "lucide-react";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PatientDialog } from "../patient-dialog";
import { NotesForm } from "./notes-form";
import { DocumentUploadForm } from "./document-upload-form";
import { APPOINTMENT_STATUS_LABELS, PAYMENT_STATUS_LABELS } from "@/lib/domain/labels";

export default async function PatientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const profile = await requireRole(["clinic_owner", "assistant", "receptionist", "professional"]);
  const supabase = await createClient();

  const { data: patient } = await supabase
    .from("patients")
    .select("*")
    .eq("id", id)
    .eq("clinic_id", profile.clinicId!)
    .is("deleted_at", null)
    .single();

  if (!patient) notFound();

  const [
    { data: appointments },
    { data: paymentIntents },
    { data: consentRecords },
    { data: documents },
  ] = await Promise.all([
    supabase.from("appointments").select("*").eq("patient_id", id).order("starts_at", { ascending: false }),
    supabase.from("payment_intents").select("*").eq("patient_id", id).order("created_at", { ascending: false }),
    supabase.from("consent_records").select("*").eq("patient_id", id).order("accepted_at", { ascending: false }),
    supabase.from("patient_documents").select("*").eq("patient_id", id).is("deleted_at", null).order("created_at", { ascending: false }),
  ]);

  const serviceIds = Array.from(new Set((appointments ?? []).map((a) => a.service_id)));
  const professionalIds = Array.from(new Set((appointments ?? []).map((a) => a.professional_id)));
  const documentIds = Array.from(new Set((consentRecords ?? []).map((c) => c.document_id)));

  const [{ data: services }, { data: professionals }, { data: consentDocs }] = await Promise.all([
    serviceIds.length > 0
      ? supabase.from("services").select("id, name").in("id", serviceIds)
      : Promise.resolve({ data: [] as { id: string; name: string }[] }),
    professionalIds.length > 0
      ? supabase.from("professionals").select("id, full_name").in("id", professionalIds)
      : Promise.resolve({ data: [] as { id: string; full_name: string }[] }),
    documentIds.length > 0
      ? supabase.from("consent_documents").select("id, title").in("id", documentIds)
      : Promise.resolve({ data: [] as { id: string; title: string }[] }),
  ]);

  const serviceById = new Map((services ?? []).map((s) => [s.id, s.name]));
  const professionalById = new Map((professionals ?? []).map((p) => [p.id, p.full_name]));
  const consentDocById = new Map((consentDocs ?? []).map((d) => [d.id, d.title]));

  const documentsWithUrls = await Promise.all(
    (documents ?? []).map(async (doc) => {
      const { data } = await supabase.storage.from("clinical-documents").createSignedUrl(doc.file_url, 3600);
      return { id: doc.id, file_name: doc.file_name, created_at: doc.created_at, signedUrl: data?.signedUrl ?? null };
    }),
  );

  const canManage = profile.role !== "professional";

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" render={<Link href="/dashboard/pacientes" />}>
        <ArrowLeft className="size-4" /> Pacientes
      </Button>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">{patient.full_name}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {[patient.phone, patient.email, patient.city].filter(Boolean).join(" · ") || "Sin datos de contacto"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {(profile.role === "clinic_owner" || profile.role === "professional") && (
            <Button variant="outline" render={<Link href={`/dashboard/clinico/${id}`} />}>
              <ShieldAlert className="size-4" />
              Historia clínica
            </Button>
          )}
          {canManage && <PatientDialog patient={patient} />}
        </div>
      </div>

      <Tabs defaultValue="citas">
        <TabsList>
          <TabsTrigger value="citas">Citas</TabsTrigger>
          <TabsTrigger value="pagos">Pagos</TabsTrigger>
          <TabsTrigger value="consentimientos">Consentimientos</TabsTrigger>
          <TabsTrigger value="documentos">Documentos</TabsTrigger>
          {canManage && <TabsTrigger value="notas">Notas</TabsTrigger>}
        </TabsList>

        <TabsContent value="citas" className="mt-4">
          {!appointments || appointments.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin citas todavía.</p>
          ) : (
            <ul className="divide-y rounded-xl border">
              {appointments.map((a) => (
                <li key={a.id} className="flex items-center justify-between gap-4 px-4 py-3">
                  <div>
                    <p className="text-sm font-medium">{serviceById.get(a.service_id) ?? "Servicio"}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(a.starts_at).toLocaleString("es-CO")} · {professionalById.get(a.professional_id) ?? "Profesional"}
                    </p>
                  </div>
                  <Badge variant="outline">{APPOINTMENT_STATUS_LABELS[a.status]}</Badge>
                </li>
              ))}
            </ul>
          )}
        </TabsContent>

        <TabsContent value="pagos" className="mt-4">
          {!paymentIntents || paymentIntents.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin pagos registrados.</p>
          ) : (
            <ul className="divide-y rounded-xl border">
              {paymentIntents.map((pi) => (
                <li key={pi.id} className="flex items-center justify-between gap-4 px-4 py-3">
                  <div>
                    <p className="text-sm font-medium">${Number(pi.amount).toLocaleString("es-CO")}</p>
                    <p className="text-xs text-muted-foreground">
                      {pi.kind === "deposit" ? "Anticipo" : "Pago completo"} · {new Date(pi.created_at).toLocaleDateString("es-CO")}
                    </p>
                  </div>
                  <Badge variant="outline">{PAYMENT_STATUS_LABELS[pi.status]}</Badge>
                </li>
              ))}
            </ul>
          )}
        </TabsContent>

        <TabsContent value="consentimientos" className="mt-4">
          {!consentRecords || consentRecords.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin consentimientos registrados.</p>
          ) : (
            <ul className="divide-y rounded-xl border">
              {consentRecords.map((c) => (
                <li key={c.id} className="px-4 py-3">
                  <p className="text-sm font-medium">{consentDocById.get(c.document_id) ?? "Documento"}</p>
                  <p className="text-xs text-muted-foreground">
                    Aceptado el {new Date(c.accepted_at).toLocaleString("es-CO")} (v{c.document_version})
                  </p>
                </li>
              ))}
            </ul>
          )}
        </TabsContent>

        <TabsContent value="documentos" className="mt-4">
          <DocumentUploadForm patientId={id} documents={documentsWithUrls} />
        </TabsContent>

        {canManage && (
          <TabsContent value="notas" className="mt-4">
            <NotesForm patientId={id} initialNotes={patient.administrative_notes ?? ""} />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}

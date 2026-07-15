import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, FileText, ShieldAlert } from "lucide-react";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getClinicEntitlements, planAtLeast } from "@/lib/modules";
import { ModuleLocked } from "@/components/patterns/module-locked";
import { NoteDialog } from "./note-dialog";
import { TreatmentPlanDialog } from "./treatment-plan-dialog";
import { PlanRowActions } from "./plan-row-actions";

export default async function ClinicalRecordPage({ params }: { params: Promise<{ patientId: string }> }) {
  const { patientId } = await params;
  const profile = await requireRole(["clinic_owner", "professional"]);
  const supabase = await createClient();

  const { data: patient } = await supabase
    .from("patients")
    .select("id, full_name")
    .eq("id", patientId)
    .eq("clinic_id", profile.clinicId!)
    .is("deleted_at", null)
    .single();

  if (!patient) notFound();

  const entitlements = await getClinicEntitlements(profile.clinicId!);
  if (!planAtLeast(entitlements, "profesional")) {
    return <ModuleLocked title="El módulo clínico protegido es parte del Plan Profesional." requiredPlan="profesional" />;
  }

  const [{ data: notes }, { data: plans }, { data: professionals }] = await Promise.all([
    supabase
      .from("clinical_notes")
      .select("*")
      .eq("patient_id", patientId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false }),
    supabase
      .from("treatment_plans")
      .select("*")
      .eq("patient_id", patientId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false }),
    supabase.from("professionals").select("*").eq("clinic_id", profile.clinicId!).is("deleted_at", null),
  ]);

  const professionalById = new Map((professionals ?? []).map((p) => [p.id, p]));

  // Auditoría de acceso: registra que este usuario vio estas notas clínicas.
  // Best-effort — no debe bloquear el render si falla.
  if (notes && notes.length > 0) {
    await supabase.from("clinical_notes_access_logs").insert(
      notes.map((n) => ({
        clinic_id: profile.clinicId!,
        clinical_note_id: n.id,
        accessed_by: profile.id,
        action: "view" as const,
      })),
    );
  }

  const showProfessionalSelect = profile.role === "clinic_owner";

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" render={<Link href={`/dashboard/pacientes/${patientId}`} />}>
        <ArrowLeft className="size-4" /> {patient.full_name}
      </Button>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Historia clínica — {patient.full_name}</h1>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
            <ShieldAlert className="size-3.5" />
            Acceso restringido y auditado. No constituye historia clínica interoperable oficial.
          </p>
        </div>
      </div>

      <Tabs defaultValue="notas">
        <TabsList>
          <TabsTrigger value="notas">Notas clínicas</TabsTrigger>
          <TabsTrigger value="planes">Plan de tratamiento</TabsTrigger>
        </TabsList>

        <TabsContent value="notas" className="mt-4 space-y-4">
          <div className="flex justify-end">
            <NoteDialog patientId={patientId} professionals={professionals ?? []} showProfessionalSelect={showProfessionalSelect} />
          </div>
          {!notes || notes.length === 0 ? (
            <div className="rounded-2xl border border-dashed p-10 text-center">
              <FileText className="mx-auto size-8 text-muted-foreground" />
              <p className="mt-3 font-medium">Sin notas clínicas todavía.</p>
            </div>
          ) : (
            <ul className="space-y-3">
              {notes.map((n) => (
                <li key={n.id} className="rounded-xl border p-4">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs text-muted-foreground">
                      {new Date(n.created_at).toLocaleString("es-CO")} · {professionalById.get(n.professional_id)?.full_name ?? "Profesional"}
                    </p>
                  </div>
                  <div className="mt-2 space-y-1.5 text-sm">
                    {n.chief_complaint && (
                      <p><span className="font-medium">Motivo: </span>{n.chief_complaint}</p>
                    )}
                    {n.evolution_notes && (
                      <p><span className="font-medium">Evolución: </span>{n.evolution_notes}</p>
                    )}
                    {n.diagnosis && <p><span className="font-medium">Diagnóstico: </span>{n.diagnosis}</p>}
                    {n.recommendations && (
                      <p><span className="font-medium">Recomendaciones: </span>{n.recommendations}</p>
                    )}
                    {n.follow_up_plan && (
                      <p><span className="font-medium">Seguimiento: </span>{n.follow_up_plan}</p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </TabsContent>

        <TabsContent value="planes" className="mt-4 space-y-4">
          <div className="flex justify-end">
            <TreatmentPlanDialog patientId={patientId} professionals={professionals ?? []} showProfessionalSelect={showProfessionalSelect} />
          </div>
          {!plans || plans.length === 0 ? (
            <div className="rounded-2xl border border-dashed p-10 text-center">
              <FileText className="mx-auto size-8 text-muted-foreground" />
              <p className="mt-3 font-medium">Sin planes de tratamiento todavía.</p>
            </div>
          ) : (
            <ul className="space-y-3">
              {plans.map((p) => {
                const procedures = Array.isArray(p.procedures) ? (p.procedures as { description: string }[]) : [];
                const balance = Number(p.total_amount) - Number(p.paid_amount);
                return (
                  <li key={p.id} className="rounded-xl border p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{p.title}</p>
                        <Badge variant={p.status === "active" ? "default" : "outline"}>
                          {p.status === "active" ? "Activo" : p.status === "completed" ? "Completado" : "Cancelado"}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {professionalById.get(p.professional_id)?.full_name ?? "Profesional"}
                      </p>
                    </div>
                    {procedures.length > 0 && (
                      <ul className="mt-2 list-inside list-disc text-sm text-muted-foreground">
                        {procedures.map((proc, i) => (
                          <li key={i}>{proc.description}</li>
                        ))}
                      </ul>
                    )}
                    {p.teeth_involved && (
                      <p className="mt-1 text-xs text-muted-foreground">Piezas: {p.teeth_involved}</p>
                    )}
                    <p className="mt-2 text-sm">
                      Total ${Number(p.total_amount).toLocaleString("es-CO")} · Abonado $
                      {Number(p.paid_amount).toLocaleString("es-CO")} · Saldo ${balance.toLocaleString("es-CO")}
                    </p>
                    <div className="mt-3">
                      <PlanRowActions patientId={patientId} planId={p.id} status={p.status} />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

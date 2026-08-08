import Link from "next/link";
import { ChevronLeft, ChevronRight, CalendarPlus } from "lucide-react";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AppointmentDialog } from "./appointment-dialog";
import { AppointmentActions } from "./appointment-actions";
import { AgendaFilters } from "./agenda-filters";
import { APPOINTMENT_STATUS_LABELS } from "@/lib/domain/labels";
import { bogotaDateInputValue, bogotaMidnightFromDateString } from "@/lib/utils/timezone";
import type { Database } from "@/lib/supabase/types";

type Status = Database["public"]["Enums"]["appointment_status"];

const STATUS_BADGE_VARIANT: Partial<Record<Status, "default" | "secondary" | "destructive" | "outline">> = {
  requested: "outline",
  pending_payment: "outline",
  pending_manual_confirmation: "outline",
  confirmed: "secondary",
  paid: "secondary",
  checked_in: "default",
  in_progress: "default",
  completed: "secondary",
  cancelled: "destructive",
  no_show: "destructive",
  rescheduled: "outline",
  expired: "destructive",
};

export default async function AgendaPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string; professional?: string; patient?: string; status?: string }>;
}) {
  const profile = await requireRole(["clinic_owner", "assistant", "receptionist", "professional"]);
  const supabase = await createClient();
  const params = await searchParams;

  const date = params.date && /^\d{4}-\d{2}-\d{2}$/.test(params.date) ? params.date : bogotaDateInputValue(new Date());
  const professionalFilter = params.professional ?? "";
  const patientFilter = params.patient ?? "";
  const statusFilter = (params.status ?? "") as Status | "";

  // Cuando se filtra por paciente, se muestran todas sus citas (pasadas y
  // futuras) en vez de limitarlo a un solo día — si no, para ver el
  // historial de un paciente había que ir día por día abriendo cita por cita.
  const filteringByPatient = Boolean(patientFilter);

  const dayStart = bogotaMidnightFromDateString(date);
  const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
  const prevDate = bogotaDateInputValue(new Date(dayStart.getTime() - 24 * 60 * 60 * 1000));
  const nextDate = bogotaDateInputValue(new Date(dayStart.getTime() + 24 * 60 * 60 * 1000));

  const [{ data: professionals }, { data: services }, { data: locations }, { data: patients }] =
    await Promise.all([
      supabase
        .from("professionals")
        .select("*")
        .eq("clinic_id", profile.clinicId!)
        .is("deleted_at", null)
        .eq("is_active", true),
      supabase
        .from("services")
        .select("*")
        .eq("clinic_id", profile.clinicId!)
        .is("deleted_at", null)
        .eq("is_active", true),
      supabase.from("clinic_locations").select("*").eq("clinic_id", profile.clinicId!).is("deleted_at", null),
      supabase.from("patients").select("*").eq("clinic_id", profile.clinicId!).order("full_name"),
    ]);

  let appointmentsQuery = supabase
    .from("appointments")
    .select("*")
    .eq("clinic_id", profile.clinicId!)
    .is("deleted_at", null);

  if (filteringByPatient) {
    appointmentsQuery = appointmentsQuery.eq("patient_id", patientFilter).order("starts_at", { ascending: false }).limit(100);
  } else {
    appointmentsQuery = appointmentsQuery
      .gte("starts_at", dayStart.toISOString())
      .lt("starts_at", dayEnd.toISOString())
      .order("starts_at");
  }

  if (professionalFilter) {
    appointmentsQuery = appointmentsQuery.eq("professional_id", professionalFilter);
  }
  if (statusFilter) {
    appointmentsQuery = appointmentsQuery.eq("status", statusFilter);
  }

  const { data: appointments } = await appointmentsQuery;

  const professionalById = new Map((professionals ?? []).map((p) => [p.id, p]));
  const serviceById = new Map((services ?? []).map((s) => [s.id, s]));
  const patientById = new Map((patients ?? []).map((p) => [p.id, p]));

  const isToday = date === bogotaDateInputValue(new Date());

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Agenda</h1>
          <p className="mt-1 text-muted-foreground">
            {filteringByPatient
              ? `${appointments?.length ?? 0} citas de ${patientById.get(patientFilter)?.full_name ?? "este paciente"}.`
              : isToday
                ? `Hoy tienes ${appointments?.length ?? 0} citas.`
                : `Citas del ${date}.`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" render={<Link href="/dashboard/lista-espera" />}>
            Lista de espera
          </Button>
          <Button variant="outline" render={<Link href="/dashboard/configuracion/horarios" />}>
            Horarios
          </Button>
          <AppointmentDialog
            professionals={professionals ?? []}
            services={services ?? []}
            patients={patients ?? []}
            locations={locations ?? []}
            defaultDate={date}
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <AgendaFilters
          date={date}
          professionalId={professionalFilter}
          patientId={patientFilter}
          status={statusFilter}
          professionals={professionals ?? []}
          patients={patients ?? []}
        />
        {!filteringByPatient && (
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" render={<Link href={`/dashboard/agenda?date=${prevDate}&professional=${professionalFilter}&status=${statusFilter}`} />}>
              <ChevronLeft className="size-4" />
            </Button>
            <Button variant="outline" size="sm" render={<Link href={`/dashboard/agenda?date=${bogotaDateInputValue(new Date())}&professional=${professionalFilter}&status=${statusFilter}`} />}>
              Hoy
            </Button>
            <Button variant="ghost" size="icon" render={<Link href={`/dashboard/agenda?date=${nextDate}&professional=${professionalFilter}&status=${statusFilter}`} />}>
              <ChevronRight className="size-4" />
            </Button>
          </div>
        )}
      </div>

      {!appointments || appointments.length === 0 ? (
        <div className="rounded-2xl border border-dashed p-10 text-center">
          <CalendarPlus className="mx-auto size-8 text-muted-foreground" />
          <p className="mt-3 font-medium">
            {filteringByPatient ? "Este paciente no tiene citas registradas." : "No tienes citas para este día."}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {filteringByPatient
              ? "Ajusta los filtros para ver otras citas."
              : "Comparte tu link de reserva o activa la lista de espera para llenar espacios libres."}
          </p>
        </div>
      ) : (
        <ul className="divide-y rounded-xl border">
          {appointments.map((appt) => {
            const professional = professionalById.get(appt.professional_id);
            const service = serviceById.get(appt.service_id);
            const patient = patientById.get(appt.patient_id);
            const time = filteringByPatient
              ? new Date(appt.starts_at).toLocaleString("es-CO", {
                  day: "2-digit",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : new Date(appt.starts_at).toLocaleTimeString("es-CO", {
                  hour: "2-digit",
                  minute: "2-digit",
                });

            return (
              <li key={appt.id} className="flex items-center justify-between gap-4 px-4 py-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium tabular-nums">{time}</span>
                    <p className="truncate text-sm font-medium">{patient?.full_name ?? "Paciente"}</p>
                    <Badge variant={STATUS_BADGE_VARIANT[appt.status] ?? "outline"}>
                      {APPOINTMENT_STATUS_LABELS[appt.status]}
                    </Badge>
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {service?.name ?? "Servicio"} · {professional?.full_name ?? "Profesional"} ·{" "}
                    {appt.modality === "virtual" ? "Virtual" : "Presencial"}
                  </p>
                </div>
                <AppointmentActions id={appt.id} status={appt.status} />
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

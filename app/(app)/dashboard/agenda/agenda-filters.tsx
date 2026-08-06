"use client";

import { useRouter } from "next/navigation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { APPOINTMENT_STATUS_LABELS } from "@/lib/domain/labels";
import type { Database } from "@/lib/supabase/types";

type Professional = Database["public"]["Tables"]["professionals"]["Row"];
type Patient = Database["public"]["Tables"]["patients"]["Row"];
type Status = Database["public"]["Enums"]["appointment_status"];

export function AgendaFilters({
  date,
  professionalId,
  patientId,
  status,
  professionals,
  patients,
}: {
  date: string;
  professionalId: string;
  patientId: string;
  status: string;
  professionals: Professional[];
  patients: Patient[];
}) {
  const router = useRouter();

  function updateParams(next: { date?: string; professional?: string; patient?: string; status?: string }) {
    const params = new URLSearchParams();
    const nextDate = next.date ?? date;
    if (nextDate) params.set("date", nextDate);
    const nextProfessional = next.professional ?? professionalId;
    if (nextProfessional) params.set("professional", nextProfessional);
    const nextPatient = next.patient ?? patientId;
    if (nextPatient) params.set("patient", nextPatient);
    const nextStatus = next.status ?? status;
    if (nextStatus) params.set("status", nextStatus);
    router.push(`/dashboard/agenda?${params.toString()}`);
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Input
        type="date"
        value={date}
        onChange={(e) => updateParams({ date: e.target.value })}
        className="w-auto"
      />
      <Select
        value={professionalId || "all"}
        onValueChange={(value) => updateParams({ professional: value === "all" ? "" : String(value) })}
      >
        <SelectTrigger className="w-auto">
          <SelectValue placeholder="Todos los profesionales">
            {(value: string) =>
              value === "all" ? "Todos los profesionales" : professionals.find((p) => p.id === value)?.full_name ?? value
            }
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos los profesionales</SelectItem>
          {professionals.map((p) => (
            <SelectItem key={p.id} value={p.id}>
              {p.full_name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select
        value={patientId || "all"}
        onValueChange={(value) => updateParams({ patient: value === "all" ? "" : String(value) })}
      >
        <SelectTrigger className="w-auto">
          <SelectValue placeholder="Todos los pacientes">
            {(value: string) =>
              value === "all" ? "Todos los pacientes" : patients.find((p) => p.id === value)?.full_name ?? value
            }
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos los pacientes</SelectItem>
          {patients.map((p) => (
            <SelectItem key={p.id} value={p.id}>
              {p.full_name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select
        value={status || "all"}
        onValueChange={(value) => updateParams({ status: value === "all" ? "" : String(value) })}
      >
        <SelectTrigger className="w-auto">
          <SelectValue placeholder="Todos los estados">
            {(value: string) =>
              value === "all" ? "Todos los estados" : APPOINTMENT_STATUS_LABELS[value as Status] ?? value
            }
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos los estados</SelectItem>
          {(Object.entries(APPOINTMENT_STATUS_LABELS) as [Status, string][]).map(([value, label]) => (
            <SelectItem key={value} value={value}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

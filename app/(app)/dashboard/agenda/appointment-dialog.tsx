"use client";

import { useActionState, useEffect, useState } from "react";
import { Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createAppointment, type AgendaActionState } from "./actions";
import type { Database } from "@/lib/supabase/types";

const initialState: AgendaActionState = {};

type Professional = Database["public"]["Tables"]["professionals"]["Row"];
type Service = Database["public"]["Tables"]["services"]["Row"];
type Patient = Database["public"]["Tables"]["patients"]["Row"];
type Location = Database["public"]["Tables"]["clinic_locations"]["Row"];

export function AppointmentDialog({
  professionals,
  services,
  patients,
  locations,
  defaultDate,
}: {
  professionals: Professional[];
  services: Service[];
  patients: Patient[];
  locations: Location[];
  defaultDate: string;
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, isPending] = useActionState(createAppointment, initialState);
  const [patientMode, setPatientMode] = useState<"existing" | "quick">(patients.length > 0 ? "existing" : "quick");

  useEffect(() => {
    if (state?.success) setOpen(false);
  }, [state]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>
        <Plus className="size-4" />
        Nueva cita
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Nueva cita</DialogTitle>
          <DialogDescription>Agenda una cita directamente desde el panel.</DialogDescription>
        </DialogHeader>

        <form action={formAction} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="professional_id">Profesional</Label>
              <Select name="professional_id" defaultValue={professionals[0]?.id}>
                <SelectTrigger id="professional_id" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {professionals.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="service_id">Servicio</Label>
              <Select name="service_id" defaultValue={services[0]?.id}>
                <SelectTrigger id="service_id" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {services.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name} ({s.duration_minutes} min)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="date">Fecha</Label>
              <Input id="date" name="date" type="date" defaultValue={defaultDate} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="time">Hora</Label>
              <Input id="time" name="time" type="time" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="modality">Modalidad</Label>
              <Select name="modality" defaultValue="in_person">
                <SelectTrigger id="modality" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="in_person">Presencial</SelectItem>
                  <SelectItem value="virtual">Virtual</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {locations.length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="location_id">Sede (opcional)</Label>
                <Select name="location_id">
                  <SelectTrigger id="location_id" className="w-full">
                    <SelectValue placeholder="Sin especificar" />
                  </SelectTrigger>
                  <SelectContent>
                    {locations.map((l) => (
                      <SelectItem key={l.id} value={l.id}>
                        {l.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <div className="space-y-3 rounded-xl border p-3">
            <div className="flex gap-2">
              {patients.length > 0 && (
                <Button
                  type="button"
                  size="sm"
                  variant={patientMode === "existing" ? "default" : "outline"}
                  onClick={() => setPatientMode("existing")}
                >
                  Paciente existente
                </Button>
              )}
              <Button
                type="button"
                size="sm"
                variant={patientMode === "quick" ? "default" : "outline"}
                onClick={() => setPatientMode("quick")}
              >
                Paciente nuevo
              </Button>
            </div>
            <input type="hidden" name="patient_mode" value={patientMode} />

            {patientMode === "existing" ? (
              <div className="space-y-2">
                <Label htmlFor="patient_id">Paciente</Label>
                <Select name="patient_id" defaultValue={patients[0]?.id}>
                  <SelectTrigger id="patient_id" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {patients.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="new_patient_name">Nombre completo</Label>
                  <Input id="new_patient_name" name="new_patient_name" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new_patient_phone">Teléfono</Label>
                  <Input id="new_patient_phone" name="new_patient_phone" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new_patient_email">Correo (opcional)</Label>
                  <Input id="new_patient_email" name="new_patient_email" type="email" />
                </div>
              </div>
            )}
          </div>

          {state?.error && <p className="text-sm text-destructive">{state.error}</p>}

          <div className="flex justify-end border-t pt-4">
            <Button type="submit" disabled={isPending || professionals.length === 0 || services.length === 0}>
              {isPending ? "Creando..." : "Crear cita"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

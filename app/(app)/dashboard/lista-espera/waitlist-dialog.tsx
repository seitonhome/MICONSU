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
import { addWaitlistEntry, type WaitlistActionState } from "./actions";
import type { Database } from "@/lib/supabase/types";

const initialState: WaitlistActionState = {};

export function WaitlistDialog({
  professionals,
  services,
  patients,
}: {
  professionals: Database["public"]["Tables"]["professionals"]["Row"][];
  services: Database["public"]["Tables"]["services"]["Row"][];
  patients: Database["public"]["Tables"]["patients"]["Row"][];
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, isPending] = useActionState(addWaitlistEntry, initialState);
  const [patientMode, setPatientMode] = useState<"existing" | "quick">(patients.length > 0 ? "existing" : "quick");

  useEffect(() => {
    if (state?.success) setOpen(false);
  }, [state]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>
        <Plus className="size-4" />
        Agregar a lista de espera
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Agregar a lista de espera</DialogTitle>
          <DialogDescription>
            Cuando se libere un espacio compatible, podrás notificar rápidamente a esta persona.
          </DialogDescription>
        </DialogHeader>

        <form action={formAction} className="space-y-4">
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
              <Select name="patient_id" defaultValue={patients[0]?.id}>
                <SelectTrigger className="w-full">
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
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="new_patient_name">Nombre completo</Label>
                  <Input id="new_patient_name" name="new_patient_name" required />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="new_patient_phone">Teléfono</Label>
                  <Input id="new_patient_phone" name="new_patient_phone" />
                </div>
              </div>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="service_id">Servicio deseado (opcional)</Label>
              <Select name="service_id">
                <SelectTrigger id="service_id" className="w-full">
                  <SelectValue placeholder="Cualquiera" />
                </SelectTrigger>
                <SelectContent>
                  {services.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="professional_id">Profesional deseado (opcional)</Label>
              <Select name="professional_id">
                <SelectTrigger id="professional_id" className="w-full">
                  <SelectValue placeholder="Cualquiera" />
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
              <Label htmlFor="date_range_start">Desde (opcional)</Label>
              <Input id="date_range_start" name="date_range_start" type="date" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="date_range_end">Hasta (opcional)</Label>
              <Input id="date_range_end" name="date_range_end" type="date" />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="time_preference">Preferencia horaria (opcional)</Label>
              <Input id="time_preference" name="time_preference" placeholder="Ej. Martes en la tarde" />
            </div>
          </div>

          {state?.error && <p className="text-sm text-destructive">{state.error}</p>}

          <div className="flex justify-end border-t pt-4">
            <Button type="submit" disabled={isPending}>
              {isPending ? "Agregando..." : "Agregar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

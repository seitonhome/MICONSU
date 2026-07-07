"use client";

import { useActionState, useEffect, useState } from "react";
import { Plus, Pencil } from "lucide-react";
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
import { createPatient, updatePatient, type PatientActionState } from "./actions";
import type { Database } from "@/lib/supabase/types";

const initialState: PatientActionState = {};

type PatientRow = Database["public"]["Tables"]["patients"]["Row"];

export function PatientDialog({ patient }: { patient?: PatientRow }) {
  const [open, setOpen] = useState(false);
  const action = patient ? updatePatient.bind(null, patient.id) : createPatient;
  const [state, formAction, isPending] = useActionState(action, initialState);

  useEffect(() => {
    if (state?.success) setOpen(false);
  }, [state]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          patient ? (
            <Button variant="ghost" size="icon" aria-label="Editar" />
          ) : (
            <Button>
              <Plus className="size-4" />
              Nuevo paciente
            </Button>
          )
        }
      >
        {patient && <Pencil className="size-4" />}
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{patient ? "Editar paciente" : "Nuevo paciente"}</DialogTitle>
          <DialogDescription>Datos administrativos del paciente o consultante.</DialogDescription>
        </DialogHeader>

        <form action={formAction} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="full_name">Nombre completo</Label>
              <Input id="full_name" name="full_name" defaultValue={patient?.full_name} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="document_type">Tipo de documento</Label>
              <Input id="document_type" name="document_type" defaultValue={patient?.document_type ?? ""} placeholder="CC" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="document_number">Número de documento</Label>
              <Input id="document_number" name="document_number" defaultValue={patient?.document_number ?? ""} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Correo</Label>
              <Input id="email" name="email" type="email" defaultValue={patient?.email ?? ""} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Teléfono</Label>
              <Input id="phone" name="phone" defaultValue={patient?.phone ?? ""} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="birth_date">Fecha de nacimiento</Label>
              <Input id="birth_date" name="birth_date" type="date" defaultValue={patient?.birth_date ?? ""} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="city">Ciudad</Label>
              <Input id="city" name="city" defaultValue={patient?.city ?? ""} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="emergency_contact_name">Contacto de emergencia</Label>
              <Input id="emergency_contact_name" name="emergency_contact_name" defaultValue={patient?.emergency_contact_name ?? ""} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="emergency_contact_phone">Teléfono de emergencia</Label>
              <Input id="emergency_contact_phone" name="emergency_contact_phone" defaultValue={patient?.emergency_contact_phone ?? ""} />
            </div>
          </div>

          {state?.error && <p className="text-sm text-destructive">{state.error}</p>}

          <div className="flex justify-end gap-2 border-t pt-4">
            <Button type="submit" disabled={isPending}>
              {isPending ? "Guardando..." : patient ? "Guardar cambios" : "Crear paciente"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

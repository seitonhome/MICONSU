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
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createProcess, type ProcessActionState } from "./actions";
import type { Database } from "@/lib/supabase/types";

const initialState: ProcessActionState = {};

export function ProcessDialog({
  patients,
  professionals,
}: {
  patients: Database["public"]["Tables"]["patients"]["Row"][];
  professionals: Database["public"]["Tables"]["professionals"]["Row"][];
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, isPending] = useActionState(createProcess, initialState);

  useEffect(() => {
    if (state?.success) setOpen(false);
  }, [state]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>
        <Plus className="size-4" />
        Nuevo proceso
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Nuevo proceso terapéutico</DialogTitle>
          <DialogDescription>
            Da seguimiento a un acompañamiento de varias sesiones (terapia, biosanación, coaching).
          </DialogDescription>
        </DialogHeader>

        <form action={formAction} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="patient_id">Paciente / consultante</Label>
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
            <div className="space-y-2 sm:col-span-2">
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
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="objective">Objetivo del proceso</Label>
              <Textarea id="objective" name="objective" rows={2} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sessions_planned">Sesiones planeadas (opcional)</Label>
              <Input id="sessions_planned" name="sessions_planned" type="number" min={1} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="next_session_at">Próxima sesión (opcional)</Label>
              <Input id="next_session_at" name="next_session_at" type="datetime-local" />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="tasks_recommendations">Tareas o recomendaciones iniciales</Label>
              <Textarea id="tasks_recommendations" name="tasks_recommendations" rows={2} />
            </div>
          </div>

          {state?.error && <p className="text-sm text-destructive">{state.error}</p>}

          <div className="flex justify-end border-t pt-4">
            <Button type="submit" disabled={isPending}>
              {isPending ? "Creando..." : "Crear proceso"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

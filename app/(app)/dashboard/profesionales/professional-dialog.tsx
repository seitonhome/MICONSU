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
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createProfessional, updateProfessional, type ProfessionalActionState } from "./actions";
import { PRACTITIONER_TYPES, PRACTITIONER_TYPE_LABELS, type PractitionerType } from "@/lib/auth/roles";
import type { Database } from "@/lib/supabase/types";

const initialState: ProfessionalActionState = {};

type ProfessionalRow = Database["public"]["Tables"]["professionals"]["Row"];

export function ProfessionalDialog({
  professional,
  defaultPractitionerType,
}: {
  professional?: ProfessionalRow;
  defaultPractitionerType: PractitionerType | null;
}) {
  const [open, setOpen] = useState(false);
  const action = professional ? updateProfessional.bind(null, professional.id) : createProfessional;
  const [state, formAction, isPending] = useActionState(action, initialState);

  useEffect(() => {
    if (state?.success) setOpen(false);
  }, [state]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          professional ? (
            <Button variant="ghost" size="icon" aria-label="Editar" />
          ) : (
            <Button>
              <Plus className="size-4" />
              Nuevo profesional
            </Button>
          )
        }
      >
        {professional && <Pencil className="size-4" />}
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{professional ? "Editar profesional" : "Nuevo profesional"}</DialogTitle>
          <DialogDescription>
            Aparece en tu agenda, tu página pública y el flujo de reserva de pacientes.
          </DialogDescription>
        </DialogHeader>

        <form action={formAction} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="full_name">Nombre completo</Label>
              <Input
                id="full_name"
                name="full_name"
                defaultValue={professional?.full_name}
                placeholder="Ej. Dra. Ana Restrepo"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="practitioner_type">Tipo de práctica</Label>
              <Select
                name="practitioner_type"
                defaultValue={professional?.practitioner_type ?? defaultPractitionerType ?? "otro"}
              >
                <SelectTrigger id="practitioner_type" className="w-full">
                  <SelectValue>
                    {(value: PractitionerType) => PRACTITIONER_TYPE_LABELS[value] ?? value}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {PRACTITIONER_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {PRACTITIONER_TYPE_LABELS[type]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="specialty_label">Especialidad o enfoque (opcional)</Label>
              <Input
                id="specialty_label"
                name="specialty_label"
                defaultValue={professional?.specialty_label ?? ""}
                placeholder="Ej. Terapia de pareja"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="license_number">Tarjeta profesional (opcional)</Label>
              <Input id="license_number" name="license_number" defaultValue={professional?.license_number ?? ""} />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="bio">Biografía breve (opcional)</Label>
              <Textarea id="bio" name="bio" defaultValue={professional?.bio ?? ""} rows={3} />
            </div>
          </div>

          <div className="flex flex-wrap gap-4">
            <label className="flex items-center gap-2 text-sm">
              <Checkbox name="accepts_in_person" defaultChecked={professional?.accepts_in_person ?? true} />
              Atiende presencial
            </label>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox name="accepts_virtual" defaultChecked={professional?.accepts_virtual ?? true} />
              Atiende virtual
            </label>
            {professional && (
              <label className="flex items-center gap-2 text-sm">
                <Checkbox name="is_active" defaultChecked={professional.is_active} />
                Activo (visible para reservar)
              </label>
            )}
          </div>

          {state?.error && <p className="text-sm text-destructive">{state.error}</p>}

          <div className="flex justify-end gap-2 border-t pt-4">
            <Button type="submit" disabled={isPending}>
              {isPending ? "Guardando..." : professional ? "Guardar cambios" : "Crear profesional"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

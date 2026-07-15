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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createClinicalNote, type ClinicalActionState } from "./actions";
import type { Database } from "@/lib/supabase/types";

const initialState: ClinicalActionState = {};

export function NoteDialog({
  patientId,
  professionals,
  showProfessionalSelect,
}: {
  patientId: string;
  professionals: Database["public"]["Tables"]["professionals"]["Row"][];
  showProfessionalSelect: boolean;
}) {
  const [open, setOpen] = useState(false);
  const action = createClinicalNote.bind(null, patientId);
  const [state, formAction, isPending] = useActionState(action, initialState);

  useEffect(() => {
    if (state?.success) setOpen(false);
  }, [state]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>
        <Plus className="size-4" />
        Nueva nota clínica
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Nueva nota clínica</DialogTitle>
          <DialogDescription>
            Las notas quedan como historial: no se editan, se agregan nuevas entradas con la evolución.
          </DialogDescription>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          {showProfessionalSelect && (
            <div className="space-y-2">
              <Label htmlFor="professional_id">Profesional tratante</Label>
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
          )}
          <div className="space-y-2">
            <Label htmlFor="chief_complaint">Motivo de consulta (opcional)</Label>
            <Textarea id="chief_complaint" name="chief_complaint" rows={2} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="evolution_notes">Evolución / notas privadas</Label>
            <Textarea id="evolution_notes" name="evolution_notes" rows={4} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="diagnosis">Diagnóstico (opcional)</Label>
            <Textarea id="diagnosis" name="diagnosis" rows={2} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="recommendations">Recomendaciones (opcional)</Label>
            <Textarea id="recommendations" name="recommendations" rows={2} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="follow_up_plan">Plan de seguimiento (opcional)</Label>
            <Textarea id="follow_up_plan" name="follow_up_plan" rows={2} />
          </div>
          {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
          <div className="flex justify-end border-t pt-4">
            <Button type="submit" disabled={isPending}>
              {isPending ? "Guardando..." : "Guardar nota"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

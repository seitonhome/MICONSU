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
import { createTreatmentPlan, type ClinicalActionState } from "./actions";
import type { Database } from "@/lib/supabase/types";

const initialState: ClinicalActionState = {};

export function TreatmentPlanDialog({
  patientId,
  professionals,
  showProfessionalSelect,
}: {
  patientId: string;
  professionals: Database["public"]["Tables"]["professionals"]["Row"][];
  showProfessionalSelect: boolean;
}) {
  const [open, setOpen] = useState(false);
  const action = createTreatmentPlan.bind(null, patientId);
  const [state, formAction, isPending] = useActionState(action, initialState);

  useEffect(() => {
    if (state?.success) setOpen(false);
  }, [state]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" />}>
        <Plus className="size-4" />
        Nuevo plan de tratamiento
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Nuevo plan de tratamiento</DialogTitle>
          <DialogDescription>Procedimientos, abonos y saldo (útil para odontología y procesos con pagos parciales).</DialogDescription>
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
            <Label htmlFor="title">Título del plan</Label>
            <Input id="title" name="title" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="procedures">Procedimientos (uno por línea)</Label>
            <Textarea id="procedures" name="procedures" rows={3} placeholder={"Ej. Limpieza dental\nResina en pieza 14"} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="teeth_involved">Piezas involucradas (opcional)</Label>
            <Input id="teeth_involved" name="teeth_involved" placeholder="Ej. 14, 15, 26" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="total_amount">Valor total</Label>
              <Input id="total_amount" name="total_amount" type="number" min={0} step="1000" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="paid_amount">Abonado hasta ahora</Label>
              <Input id="paid_amount" name="paid_amount" type="number" min={0} step="1000" defaultValue={0} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="next_appointment_suggestion">Próxima cita sugerida (opcional)</Label>
            <Input id="next_appointment_suggestion" name="next_appointment_suggestion" type="date" />
          </div>
          {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
          <div className="flex justify-end border-t pt-4">
            <Button type="submit" disabled={isPending}>
              {isPending ? "Guardando..." : "Guardar plan"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

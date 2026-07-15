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
import { createFollowup, type FollowupActionState } from "./actions";
import type { Database } from "@/lib/supabase/types";

const initialState: FollowupActionState = {};

const TYPES = [
  { value: "thank_you", label: "Mensaje de agradecimiento" },
  { value: "satisfaction_survey", label: "Encuesta de satisfacción" },
  { value: "review_request", label: "Solicitud de reseña" },
  { value: "package_renewal", label: "Renovación de paquete" },
  { value: "custom", label: "Personalizado" },
];

export function FollowupDialog({ patients }: { patients: Database["public"]["Tables"]["patients"]["Row"][] }) {
  const [open, setOpen] = useState(false);
  const [state, formAction, isPending] = useActionState(createFollowup, initialState);

  useEffect(() => {
    if (state?.success) setOpen(false);
  }, [state]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>
        <Plus className="size-4" />
        Nuevo seguimiento
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Nuevo seguimiento postconsulta</DialogTitle>
          <DialogDescription>Agradecimiento, encuesta, solicitud de reseña o renovación de paquete.</DialogDescription>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
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
          <div className="space-y-2">
            <Label htmlFor="followup_type">Tipo</Label>
            <Select name="followup_type" defaultValue="thank_you">
              <SelectTrigger id="followup_type" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="scheduled_for">Programado para</Label>
            <Input id="scheduled_for" name="scheduled_for" type="datetime-local" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="message">Mensaje (opcional)</Label>
            <Textarea id="message" name="message" rows={3} />
          </div>
          {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
          <div className="flex justify-end border-t pt-4">
            <Button type="submit" disabled={isPending}>
              {isPending ? "Creando..." : "Crear seguimiento"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

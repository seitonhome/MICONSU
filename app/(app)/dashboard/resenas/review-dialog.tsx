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
import { createReview, type ReviewActionState } from "./actions";
import type { Database } from "@/lib/supabase/types";

const initialState: ReviewActionState = {};

export function ReviewDialog({
  patients,
  professionals,
  services,
}: {
  patients: Database["public"]["Tables"]["patients"]["Row"][];
  professionals: Database["public"]["Tables"]["professionals"]["Row"][];
  services: Database["public"]["Tables"]["services"]["Row"][];
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, isPending] = useActionState(createReview, initialState);

  useEffect(() => {
    if (state?.success) setOpen(false);
  }, [state]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>
        <Plus className="size-4" />
        Registrar reseña
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Registrar reseña</DialogTitle>
          <DialogDescription>Para reseñas recibidas por teléfono, WhatsApp o en persona.</DialogDescription>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="rating">Calificación (1 a 5)</Label>
            <Select name="rating" defaultValue="5">
              <SelectTrigger id="rating" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[5, 4, 3, 2, 1].map((n) => (
                  <SelectItem key={n} value={String(n)}>
                    {"★".repeat(n)}
                    {"☆".repeat(5 - n)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="patient_id">Paciente (opcional)</Label>
            <Select name="patient_id">
              <SelectTrigger id="patient_id" className="w-full">
                <SelectValue placeholder="Anónimo" />
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
            <Label htmlFor="professional_id">Profesional (opcional)</Label>
            <Select name="professional_id">
              <SelectTrigger id="professional_id" className="w-full">
                <SelectValue placeholder="Sin especificar" />
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
            <Label htmlFor="service_id">Servicio (opcional)</Label>
            <Select name="service_id">
              <SelectTrigger id="service_id" className="w-full">
                <SelectValue placeholder="Sin especificar" />
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
            <Label htmlFor="comment">Comentario (opcional)</Label>
            <Textarea id="comment" name="comment" rows={3} />
          </div>
          {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
          <div className="flex justify-end border-t pt-4">
            <Button type="submit" disabled={isPending}>
              {isPending ? "Guardando..." : "Guardar reseña"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

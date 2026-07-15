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
import { createGroupSession, type GroupSessionActionState } from "./actions";
import type { Database } from "@/lib/supabase/types";

const initialState: GroupSessionActionState = {};

export function GroupSessionDialog({
  professionals,
  services,
  locations,
}: {
  professionals: Database["public"]["Tables"]["professionals"]["Row"][];
  services: Database["public"]["Tables"]["services"]["Row"][];
  locations: Database["public"]["Tables"]["clinic_locations"]["Row"][];
}) {
  const [open, setOpen] = useState(false);
  const [modality, setModality] = useState<"in_person" | "virtual">("in_person");
  const [state, formAction, isPending] = useActionState(createGroupSession, initialState);

  useEffect(() => {
    if (state?.success) setOpen(false);
  }, [state]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>
        <Plus className="size-4" />
        Nuevo taller
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Nuevo taller o sesión grupal</DialogTitle>
          <DialogDescription>Talleres, círculos, clases grupales o jornadas de bienestar.</DialogDescription>
        </DialogHeader>

        <form action={formAction} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="name">Nombre</Label>
              <Input id="name" name="name" required />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="description">Descripción (opcional)</Label>
              <Textarea id="description" name="description" rows={2} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="starts_at">Inicio</Label>
              <Input id="starts_at" name="starts_at" type="datetime-local" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ends_at">Fin</Label>
              <Input id="ends_at" name="ends_at" type="datetime-local" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="max_capacity">Cupos máximos</Label>
              <Input id="max_capacity" name="max_capacity" type="number" min={1} defaultValue={10} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="modality">Modalidad</Label>
              <Select name="modality" defaultValue="in_person" onValueChange={(v) => setModality(v as "in_person" | "virtual")}>
                <SelectTrigger id="modality" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="in_person">Presencial</SelectItem>
                  <SelectItem value="virtual">Virtual</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {modality === "virtual" ? (
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="virtual_link">Enlace virtual</Label>
                <Input id="virtual_link" name="virtual_link" placeholder="https://" />
              </div>
            ) : (
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="location_id">Sede (opcional)</Label>
                <Select name="location_id">
                  <SelectTrigger id="location_id" className="w-full">
                    <SelectValue placeholder="Sin sede específica" />
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
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="professional_id">Profesional a cargo (opcional)</Label>
              <Select name="professional_id">
                <SelectTrigger id="professional_id" className="w-full">
                  <SelectValue placeholder="Sin asignar" />
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
              <Label htmlFor="service_id">Servicio asociado (opcional)</Label>
              <Select name="service_id">
                <SelectTrigger id="service_id" className="w-full">
                  <SelectValue placeholder="Sin servicio específico" />
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
          </div>

          {state?.error && <p className="text-sm text-destructive">{state.error}</p>}

          <div className="flex justify-end border-t pt-4">
            <Button type="submit" disabled={isPending}>
              {isPending ? "Creando..." : "Crear taller"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

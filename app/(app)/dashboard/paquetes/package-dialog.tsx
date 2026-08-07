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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createPackage, updatePackage, type PackageActionState } from "./actions";
import type { Database } from "@/lib/supabase/types";

const initialState: PackageActionState = {};

type PackageRow = Database["public"]["Tables"]["session_packages"]["Row"];

export function PackageDialog({
  pkg,
  patients,
  professionals,
  services,
}: {
  pkg?: PackageRow;
  patients: Database["public"]["Tables"]["patients"]["Row"][];
  professionals: Database["public"]["Tables"]["professionals"]["Row"][];
  services: Database["public"]["Tables"]["services"]["Row"][];
}) {
  const [open, setOpen] = useState(false);
  const action = pkg ? updatePackage.bind(null, pkg.id) : createPackage;
  const [state, formAction, isPending] = useActionState(action, initialState);
  const isEdit = Boolean(pkg);

  useEffect(() => {
    if (state?.success) setOpen(false);
  }, [state]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          isEdit ? (
            <Button variant="ghost" size="icon" aria-label="Editar paquete" />
          ) : (
            <Button />
          )
        }
      >
        {isEdit ? (
          <Pencil className="size-4" />
        ) : (
          <>
            <Plus className="size-4" />
            Nuevo paquete
          </>
        )}
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar paquete" : "Nuevo paquete de sesiones"}</DialogTitle>
          <DialogDescription>
            Vende un proceso completo en lugar de citas sueltas y lleva el control de sesiones usadas.
          </DialogDescription>
        </DialogHeader>

        <form action={formAction} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="name">Nombre del paquete</Label>
              <Input id="name" name="name" placeholder="Ej. Paquete de 10 sesiones" defaultValue={pkg?.name} required />
            </div>
            {!isEdit && (
              <>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="patient_id">Paciente</Label>
                  <Select name="patient_id" defaultValue={patients[0]?.id}>
                    <SelectTrigger id="patient_id" className="w-full">
                      <SelectValue>
                        {(value: string) => patients.find((p) => p.id === value)?.full_name ?? value}
                      </SelectValue>
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
                      <SelectValue>
                        {(value: string) => professionals.find((p) => p.id === value)?.full_name ?? value}
                      </SelectValue>
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
                      <SelectValue placeholder="Sin servicio específico">
                        {(value: string) => services.find((s) => s.id === value)?.name ?? value}
                      </SelectValue>
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
              </>
            )}
            <div className="space-y-2">
              <Label htmlFor="total_sessions">Número de sesiones</Label>
              <Input
                id="total_sessions"
                name="total_sessions"
                type="number"
                min={pkg?.sessions_used || 1}
                defaultValue={pkg?.total_sessions}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="valid_until">Vigencia hasta (opcional)</Label>
              <Input id="valid_until" name="valid_until" type="date" defaultValue={pkg?.valid_until ?? undefined} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="price_total">Precio total</Label>
              <Input id="price_total" name="price_total" type="number" min={0} step="1000" defaultValue={pkg?.price_total} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="deposit_amount">Anticipo (opcional)</Label>
              <Input id="deposit_amount" name="deposit_amount" type="number" min={0} step="1000" defaultValue={pkg?.deposit_amount} />
            </div>
          </div>

          {state?.error && <p className="text-sm text-destructive">{state.error}</p>}

          <div className="flex justify-end border-t pt-4">
            <Button type="submit" disabled={isPending}>
              {isPending ? "Guardando..." : isEdit ? "Guardar cambios" : "Crear paquete"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

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
import { createService, updateService, type ServiceActionState } from "./actions";
import { SERVICE_CLASSIFICATION_LABELS, MODALITY_LABELS } from "@/lib/domain/labels";
import type { Database } from "@/lib/supabase/types";

const initialState: ServiceActionState = {};

type ServiceRow = Database["public"]["Tables"]["services"]["Row"];
type CategoryRow = Database["public"]["Tables"]["service_categories"]["Row"];

export function ServiceDialog({
  service,
  categories,
}: {
  service?: ServiceRow;
  categories: CategoryRow[];
}) {
  const [open, setOpen] = useState(false);
  const action = service ? updateService.bind(null, service.id) : createService;
  const [state, formAction, isPending] = useActionState(action, initialState);

  useEffect(() => {
    if (state?.success) setOpen(false);
  }, [state]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          service ? (
            <Button variant="ghost" size="icon" aria-label="Editar servicio" />
          ) : (
            <Button>
              <Plus className="size-4" />
              Nuevo servicio
            </Button>
          )
        }
      >
        {service && <Pencil className="size-4" />}
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{service ? "Editar servicio" : "Nuevo servicio"}</DialogTitle>
          <DialogDescription>
            Configura duración, precio, modalidad y reglas de pago para este servicio.
          </DialogDescription>
        </DialogHeader>

        <form action={formAction} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="name">Nombre</Label>
              <Input id="name" name="name" defaultValue={service?.name} required />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="description">Descripción (opcional)</Label>
              <Textarea id="description" name="description" defaultValue={service?.description ?? ""} rows={2} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category_id">Categoría (opcional)</Label>
              <Select name="category_id" defaultValue={service?.category_id ?? undefined}>
                <SelectTrigger id="category_id" className="w-full">
                  <SelectValue placeholder="Sin categoría" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="classification">Clasificación</Label>
              <Select name="classification" defaultValue={service?.classification ?? "servicio_bienestar"}>
                <SelectTrigger id="classification" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(SERVICE_CLASSIFICATION_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="duration_minutes">Duración (min)</Label>
              <Input
                id="duration_minutes"
                name="duration_minutes"
                type="number"
                min={5}
                defaultValue={service?.duration_minutes ?? 30}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="modality">Modalidad</Label>
              <Select name="modality" defaultValue={service?.modality ?? "both"}>
                <SelectTrigger id="modality" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(MODALITY_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="price">Precio (COP)</Label>
              <Input id="price" name="price" type="number" min={0} defaultValue={service?.price ?? 0} />
            </div>
            <label className="mt-6 flex items-center gap-2 text-sm">
              <Checkbox name="price_visible" defaultChecked={service?.price_visible ?? true} />
              Mostrar precio en la página pública
            </label>

            <div className="space-y-2">
              <Label htmlFor="payment_type">Tipo de pago</Label>
              <Select name="payment_type" defaultValue={service?.payment_type ?? "none"}>
                <SelectTrigger id="payment_type" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No requiere pago</SelectItem>
                  <SelectItem value="deposit">Anticipo</SelectItem>
                  <SelectItem value="full">Pago completo</SelectItem>
                  <SelectItem value="manual">Transferencia manual</SelectItem>
                  <SelectItem value="in_person">Pago presencial</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="deposit_amount">Monto de anticipo (si aplica)</Label>
              <Input id="deposit_amount" name="deposit_amount" type="number" min={0} defaultValue={service?.deposit_amount ?? ""} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="min_advance_hours">Anticipación mínima (horas)</Label>
              <Input id="min_advance_hours" name="min_advance_hours" type="number" min={0} defaultValue={service?.min_advance_hours ?? 0} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="max_cancel_hours">Horas límite para cancelar</Label>
              <Input id="max_cancel_hours" name="max_cancel_hours" type="number" min={0} defaultValue={service?.max_cancel_hours ?? 0} />
            </div>

            <label className="flex items-center gap-2 text-sm sm:col-span-2">
              <Checkbox name="requires_additional_consent" defaultChecked={service?.requires_additional_consent ?? false} />
              Requiere consentimiento adicional específico
            </label>
            <label className="flex items-center gap-2 text-sm sm:col-span-2">
              <Checkbox name="allows_package" defaultChecked={service?.allows_package ?? false} />
              Se puede vender como paquete de sesiones
            </label>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="pre_instructions">Instrucciones previas (opcional)</Label>
              <Textarea id="pre_instructions" name="pre_instructions" defaultValue={service?.pre_instructions ?? ""} rows={2} />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="disclaimer">Aviso / disclaimer específico (opcional)</Label>
              <Textarea id="disclaimer" name="disclaimer" defaultValue={service?.disclaimer ?? ""} rows={2} />
            </div>
          </div>

          <input type="hidden" name="color_hex" value={service?.color_hex ?? "#0F4C4C"} />

          {state?.error && <p className="text-sm text-destructive">{state.error}</p>}

          <div className="flex justify-end gap-2 border-t pt-4">
            <Button type="submit" disabled={isPending}>
              {isPending ? "Guardando..." : service ? "Guardar cambios" : "Crear servicio"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

"use client";

import { useActionState } from "react";
import { Trash2, Sparkles } from "lucide-react";
import { applyServiceTemplates, addServiceManual, deleteService, type OnboardingActionState } from "../actions";
import { StepShell } from "../_components/step-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SERVICE_CLASSIFICATION_LABELS, MODALITY_LABELS } from "@/lib/domain/labels";
import type { Database } from "@/lib/supabase/types";

const initialState: OnboardingActionState = {};

export function Step6Servicios({
  services,
  hasPractitionerType,
}: {
  services: Database["public"]["Tables"]["services"]["Row"][];
  hasPractitionerType: boolean;
}) {
  const [state, formAction, isPending] = useActionState(addServiceManual, initialState);
  const [templatesState, templatesAction, templatesPending] = useActionState(
    applyServiceTemplates,
    initialState,
  );

  return (
    <StepShell
      title="Define los servicios que ofreces"
      description="Puedes usar nuestras plantillas sugeridas según tu tipo de práctica y ajustarlas después."
      prevHref="/onboarding/5"
      nextHref="/onboarding/7"
      hideNext={services.length === 0}
    >
      {hasPractitionerType && (
        <form action={templatesAction}>
          <Button type="submit" variant="outline" disabled={templatesPending}>
            <Sparkles className="size-4" />
            {templatesPending ? "Agregando..." : "Usar plantillas sugeridas para mi práctica"}
          </Button>
          {templatesState?.error && <p className="mt-2 text-sm text-destructive">{templatesState.error}</p>}
        </form>
      )}

      {services.length > 0 && (
        <ul className="divide-y rounded-xl border">
          {services.map((s) => (
            <li key={s.id} className="flex items-center justify-between px-4 py-3">
              <div>
                <p className="text-sm font-medium">{s.name}</p>
                <p className="text-xs text-muted-foreground">
                  {s.duration_minutes} min · {SERVICE_CLASSIFICATION_LABELS[s.classification]}
                </p>
              </div>
              <form action={deleteService.bind(null, s.id)}>
                <Button type="submit" variant="ghost" size="icon" aria-label="Eliminar">
                  <Trash2 className="size-4" />
                </Button>
              </form>
            </li>
          ))}
        </ul>
      )}

      <form action={formAction} className="space-y-4 rounded-xl border p-4">
        <p className="text-sm font-medium">Agregar servicio manualmente</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="name">Nombre del servicio</Label>
            <Input id="name" name="name" placeholder="Ej. Sesión de seguimiento" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="duration_minutes">Duración (minutos)</Label>
            <Input id="duration_minutes" name="duration_minutes" type="number" min={5} defaultValue={30} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="price">Precio (COP)</Label>
            <Input id="price" name="price" type="number" min={0} defaultValue={0} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="classification">Clasificación</Label>
            <Select name="classification" defaultValue="servicio_bienestar">
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
            <Label htmlFor="modality">Modalidad</Label>
            <Select name="modality" defaultValue="both">
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
        </div>

        {state?.error && <p className="text-sm text-destructive">{state.error}</p>}

        <Button type="submit" variant="outline" disabled={isPending}>
          {isPending ? "Agregando..." : "Agregar servicio"}
        </Button>
      </form>
    </StepShell>
  );
}

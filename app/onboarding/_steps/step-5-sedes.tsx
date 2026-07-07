"use client";

import { useActionState, useState } from "react";
import { Trash2 } from "lucide-react";
import { addLocation, deleteLocation, type OnboardingActionState } from "../actions";
import { StepShell } from "../_components/step-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import type { Database } from "@/lib/supabase/types";

const initialState: OnboardingActionState = {};

export function Step5Sedes({
  locations,
}: {
  locations: Database["public"]["Tables"]["clinic_locations"]["Row"][];
}) {
  const [state, formAction, isPending] = useActionState(addLocation, initialState);
  const [isVirtual, setIsVirtual] = useState(false);

  return (
    <StepShell
      title="¿Dónde atiendes?"
      description="Agrega tu sede física, o marca 'solo modalidad virtual' si atiendes por teleconsulta."
      prevHref="/onboarding/4"
      nextHref="/onboarding/6"
      hideNext={locations.length === 0}
    >
      {locations.length > 0 && (
        <ul className="divide-y rounded-xl border">
          {locations.map((loc) => (
            <li key={loc.id} className="flex items-center justify-between px-4 py-3">
              <div>
                <p className="text-sm font-medium">{loc.name}</p>
                <p className="text-xs text-muted-foreground">
                  {loc.is_virtual ? "Modalidad virtual" : [loc.address, loc.city].filter(Boolean).join(", ") || "Sin dirección"}
                </p>
              </div>
              <form action={deleteLocation.bind(null, loc.id)}>
                <Button type="submit" variant="ghost" size="icon" aria-label="Eliminar">
                  <Trash2 className="size-4" />
                </Button>
              </form>
            </li>
          ))}
        </ul>
      )}

      <form action={formAction} className="space-y-4 rounded-xl border p-4">
        <div className="space-y-2">
          <Label htmlFor="name">Nombre de la sede</Label>
          <Input id="name" name="name" placeholder="Ej. Consultorio Norte, o Atención virtual" required />
        </div>

        <label className="flex items-center gap-2 text-sm">
          <Checkbox name="is_virtual" checked={isVirtual} onCheckedChange={(v) => setIsVirtual(v === true)} />
          Es una modalidad virtual (sin dirección física)
        </label>

        {!isVirtual && (
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="address">Dirección</Label>
              <Input id="address" name="address" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="city">Ciudad</Label>
              <Input id="city" name="city" />
            </div>
          </div>
        )}

        {state?.error && <p className="text-sm text-destructive">{state.error}</p>}

        <Button type="submit" variant="outline" disabled={isPending}>
          {isPending ? "Agregando..." : "Agregar sede"}
        </Button>
      </form>
    </StepShell>
  );
}

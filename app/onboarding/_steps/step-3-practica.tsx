"use client";

import { useActionState } from "react";
import { updatePractitionerType, type OnboardingActionState } from "../actions";
import { StepShell } from "../_components/step-shell";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { PRACTITIONER_TYPES, PRACTITIONER_TYPE_LABELS, type PractitionerType } from "@/lib/auth/roles";

const initialState: OnboardingActionState = {};

export function Step3Practica({ currentType }: { currentType: PractitionerType | null }) {
  const [state, formAction, isPending] = useActionState(updatePractitionerType, initialState);

  return (
    <form action={formAction}>
      <StepShell
        title="¿Cuál es el enfoque principal de tu consultorio?"
        description="Esto adapta el lenguaje, las plantillas de servicios y los avisos legales sugeridos a tu tipo de práctica."
        hideNext
      >
        <div className="max-w-sm space-y-2">
          <Label htmlFor="practitioner_type">Tipo de práctica</Label>
          <Select name="practitioner_type" defaultValue={currentType ?? undefined}>
            <SelectTrigger id="practitioner_type" className="w-full">
              <SelectValue placeholder="Selecciona una opción" />
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

        {state?.error && <p className="text-sm text-destructive">{state.error}</p>}

        <div className="flex justify-end border-t pt-6">
          <Button type="submit" disabled={isPending}>
            {isPending ? "Guardando..." : "Continuar"}
          </Button>
        </div>
      </StepShell>
    </form>
  );
}

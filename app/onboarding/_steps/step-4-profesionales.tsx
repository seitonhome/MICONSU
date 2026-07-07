"use client";

import { useActionState } from "react";
import { Trash2 } from "lucide-react";
import { addProfessional, deleteProfessional, type OnboardingActionState } from "../actions";
import { StepShell } from "../_components/step-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PRACTITIONER_TYPES, PRACTITIONER_TYPE_LABELS, type PractitionerType } from "@/lib/auth/roles";
import type { Database } from "@/lib/supabase/types";

const initialState: OnboardingActionState = {};

export function Step4Profesionales({
  professionals,
  defaultPractitionerType,
  hasOwnerLinked,
}: {
  professionals: Database["public"]["Tables"]["professionals"]["Row"][];
  defaultPractitionerType: PractitionerType | null;
  hasOwnerLinked: boolean;
}) {
  const [state, formAction, isPending] = useActionState(addProfessional, initialState);

  return (
    <StepShell
      title="¿Quién atiende en tu consultorio?"
      description="Agrega al menos un profesional. Puedes agregar más adelante desde el panel."
      prevHref="/onboarding/3"
      nextHref="/onboarding/5"
      hideNext={professionals.length === 0}
    >
      {professionals.length > 0 && (
        <ul className="divide-y rounded-xl border">
          {professionals.map((p) => (
            <li key={p.id} className="flex items-center justify-between px-4 py-3">
              <div>
                <p className="text-sm font-medium">{p.full_name}</p>
                <p className="text-xs text-muted-foreground">
                  {PRACTITIONER_TYPE_LABELS[p.practitioner_type]}
                  {p.specialty_label ? ` · ${p.specialty_label}` : ""}
                </p>
              </div>
              <form action={deleteProfessional.bind(null, p.id)}>
                <Button type="submit" variant="ghost" size="icon" aria-label="Eliminar">
                  <Trash2 className="size-4" />
                </Button>
              </form>
            </li>
          ))}
        </ul>
      )}

      <form action={formAction} className="space-y-4 rounded-xl border p-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="full_name">Nombre completo</Label>
            <Input id="full_name" name="full_name" placeholder="Ej. Dra. Ana Restrepo" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="practitioner_type">Tipo de práctica</Label>
            <Select name="practitioner_type" defaultValue={defaultPractitionerType ?? "otro"}>
              <SelectTrigger id="practitioner_type" className="w-full">
                <SelectValue />
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
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="specialty_label">Especialidad o enfoque (opcional)</Label>
            <Input id="specialty_label" name="specialty_label" placeholder="Ej. Terapia de pareja" />
          </div>
        </div>

        {!hasOwnerLinked && (
          <label className="flex items-center gap-2 text-sm">
            <Checkbox name="link_owner_profile" />
            Este profesional soy yo (dueño de la cuenta)
          </label>
        )}

        {state?.error && <p className="text-sm text-destructive">{state.error}</p>}

        <Button type="submit" variant="outline" disabled={isPending}>
          {isPending ? "Agregando..." : "Agregar profesional"}
        </Button>
      </form>
    </StepShell>
  );
}

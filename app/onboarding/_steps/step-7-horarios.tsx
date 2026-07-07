"use client";

import { useActionState } from "react";
import { Trash2 } from "lucide-react";
import { addAvailabilityRule, deleteAvailabilityRule, type OnboardingActionState } from "../actions";
import { StepShell } from "../_components/step-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { WEEKDAY_LABELS } from "@/lib/domain/labels";
import type { Database } from "@/lib/supabase/types";

const initialState: OnboardingActionState = {};

export function Step7Horarios({
  professionals,
  availabilityRules,
}: {
  professionals: Database["public"]["Tables"]["professionals"]["Row"][];
  availabilityRules: Database["public"]["Tables"]["availability_rules"]["Row"][];
}) {
  const [state, formAction, isPending] = useActionState(addAvailabilityRule, initialState);
  const professionalName = (id: string) => professionals.find((p) => p.id === id)?.full_name ?? "—";

  return (
    <StepShell
      title="¿Cuál es tu horario de atención?"
      description="Define los días y horas en que cada profesional está disponible para recibir reservas."
      prevHref="/onboarding/6"
      nextHref="/onboarding/8"
      hideNext={availabilityRules.length === 0}
    >
      {professionals.length === 0 ? (
        <p className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
          Agrega primero un profesional en el paso anterior para poder definir su horario.
        </p>
      ) : (
        <>
          {availabilityRules.length > 0 && (
            <ul className="divide-y rounded-xl border">
              {availabilityRules.map((rule) => (
                <li key={rule.id} className="flex items-center justify-between px-4 py-3">
                  <p className="text-sm">
                    <span className="font-medium">{professionalName(rule.professional_id)}</span> ·{" "}
                    {WEEKDAY_LABELS[rule.day_of_week]} · {rule.start_time.slice(0, 5)} - {rule.end_time.slice(0, 5)}
                  </p>
                  <form action={deleteAvailabilityRule.bind(null, rule.id)}>
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
              <Label htmlFor="professional_id">Profesional</Label>
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

            <div className="space-y-2">
              <Label>Días</Label>
              <div className="flex flex-wrap gap-3">
                {WEEKDAY_LABELS.map((label, index) => (
                  <label key={index} className="flex items-center gap-1.5 text-sm">
                    <Checkbox name="days" value={String(index)} defaultChecked={index >= 1 && index <= 5} />
                    {label}
                  </label>
                ))}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="start_time">Hora de inicio</Label>
                <Input id="start_time" name="start_time" type="time" defaultValue="08:00" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end_time">Hora de fin</Label>
                <Input id="end_time" name="end_time" type="time" defaultValue="17:00" required />
              </div>
            </div>

            {state?.error && <p className="text-sm text-destructive">{state.error}</p>}

            <Button type="submit" variant="outline" disabled={isPending}>
              {isPending ? "Guardando..." : "Agregar horario"}
            </Button>
          </form>
        </>
      )}
    </StepShell>
  );
}

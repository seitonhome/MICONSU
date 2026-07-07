"use client";

import { CheckCircle2, Circle } from "lucide-react";
import { publishClinic } from "../actions";
import { StepShell } from "../_components/step-shell";
import { Button } from "@/components/ui/button";
import { ONBOARDING_STEPS } from "../_lib/steps";
import type { StepCompletion } from "../_lib/context";

export function Step12Publicacion({
  completion,
  isPublished,
}: {
  completion: StepCompletion;
  isPublished: boolean;
}) {
  const requiredSteps = ONBOARDING_STEPS.filter((s) => s.id <= 9);
  const allRequiredDone = requiredSteps.every((s) => completion[s.id]);

  return (
    <StepShell
      title={isPublished ? "Tu consultorio ya está publicado" : "Todo listo para publicar"}
      description={
        isPublished
          ? "Tu página pública ya está visible y puede recibir reservas."
          : "Revisa tu checklist de activación. Puedes publicar aunque falte algo opcional y completarlo después."
      }
      prevHref="/onboarding/11"
    >
      <ul className="space-y-2">
        {requiredSteps.map((step) => (
          <li key={step.id} className="flex items-center gap-2 text-sm">
            {completion[step.id] ? (
              <CheckCircle2 className="size-4 text-primary" />
            ) : (
              <Circle className="size-4 text-muted-foreground" />
            )}
            {step.title}
          </li>
        ))}
      </ul>

      {isPublished ? (
        <Button variant="outline" disabled>
          Ya publicado
        </Button>
      ) : (
        <form action={publishClinic}>
          <Button type="submit" size="lg">
            {allRequiredDone ? "Publicar mi consultorio" : "Publicar de todas formas"}
          </Button>
        </form>
      )}
    </StepShell>
  );
}

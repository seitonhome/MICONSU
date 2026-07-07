"use client";

import { useActionState } from "react";
import { CheckCircle2 } from "lucide-react";
import { activateConsents, type OnboardingActionState } from "../actions";
import { StepShell } from "../_components/step-shell";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { CONSENT_TEMPLATES } from "@/lib/templates/consent-templates";
import type { Database } from "@/lib/supabase/types";

const initialState: OnboardingActionState = {};

type ConsentType = Database["public"]["Enums"]["consent_document_type"];

export function Step9Consentimientos({
  consentDocuments,
  suggestedTypes,
}: {
  consentDocuments: Database["public"]["Tables"]["consent_documents"]["Row"][];
  suggestedTypes: ConsentType[];
}) {
  const [state, formAction, isPending] = useActionState(activateConsents, initialState);
  const activeTypes = new Set(consentDocuments.map((d) => d.document_type));

  return (
    <form action={formAction}>
      <StepShell
        title="Activa tus documentos legales"
        description="Preseleccionamos los documentos recomendados según los servicios que definiste. Podrás editar el texto de cada uno después."
        prevHref="/onboarding/8"
        nextHref="/onboarding/10"
        hideNext={consentDocuments.length === 0}
      >
        <ul className="space-y-2">
          {(Object.keys(CONSENT_TEMPLATES) as ConsentType[]).map((type) => {
            const active = activeTypes.has(type);
            return (
              <li key={type} className="flex items-start gap-3 rounded-xl border p-3">
                <Checkbox
                  name="document_type"
                  value={type}
                  defaultChecked={active || suggestedTypes.includes(type)}
                  disabled={active}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">{CONSENT_TEMPLATES[type].title}</p>
                    {active && (
                      <span className="flex items-center gap-1 text-xs text-primary">
                        <CheckCircle2 className="size-3.5" /> Activo
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{CONSENT_TEMPLATES[type].body}</p>
                </div>
              </li>
            );
          })}
        </ul>

        {state?.error && <p className="text-sm text-destructive">{state.error}</p>}

        <div className="flex justify-end border-t pt-6">
          <Button type="submit" disabled={isPending}>
            {isPending ? "Guardando..." : "Activar seleccionados"}
          </Button>
        </div>
      </StepShell>
    </form>
  );
}

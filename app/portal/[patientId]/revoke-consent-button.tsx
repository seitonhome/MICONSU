"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { revokeConsent } from "./actions";

export function RevokeConsentButton({ consentId, patientId }: { consentId: string; patientId: string }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="text-xs font-medium text-destructive underline underline-offset-4"
      >
        Retirar
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {error && <span className="text-xs text-destructive">{error}</span>}
      <span className="text-xs text-muted-foreground">¿Retirar tu consentimiento?</span>
      <Button
        type="button"
        variant="destructive"
        size="sm"
        disabled={isPending}
        onClick={() =>
          startTransition(async () => {
            const result = await revokeConsent(consentId, patientId);
            if (result.error) setError(result.error);
            else setConfirming(false);
          })
        }
      >
        {isPending ? "Retirando..." : "Sí, retirar"}
      </Button>
      <button type="button" onClick={() => setConfirming(false)} className="text-xs text-muted-foreground underline underline-offset-4">
        Cancelar
      </button>
    </div>
  );
}

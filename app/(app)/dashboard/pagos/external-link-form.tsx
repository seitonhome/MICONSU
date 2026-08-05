"use client";

import { useActionState, useTransition } from "react";
import { configureExternalLink, toggleExternalLinkActive, type PaymentsActionState } from "./actions";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";

const initialState: PaymentsActionState = {};

export function ExternalLinkForm({ isConfigured, isActive }: { isConfigured: boolean; isActive: boolean }) {
  const [state, formAction, isPending] = useActionState(configureExternalLink, initialState);
  const [isToggling, startToggle] = useTransition();

  return (
    <div className="space-y-4">
      {isConfigured && (
        <div className="flex items-center justify-between rounded-lg bg-muted/30 p-3 text-sm">
          <span>Tienes un link externo configurado.</span>
          <Switch
            checked={isActive}
            disabled={isToggling}
            onCheckedChange={(checked) => startToggle(() => toggleExternalLinkActive(checked))}
          />
        </div>
      )}

      <form action={formAction} className="grid gap-3">
        <div className="space-y-2">
          <Label htmlFor="link_url">URL del link de pago</Label>
          <Input id="link_url" name="link_url" type="url" placeholder="https://checkout.tu-pasarela.com/..." required />
        </div>
        {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
        {state?.success && <p className="text-sm text-primary">Guardado.</p>}
        <Button type="submit" variant="outline" size="sm" disabled={isPending} className="w-fit">
          {isPending ? "Guardando..." : isConfigured ? "Actualizar link" : "Guardar y activar"}
        </Button>
      </form>
    </div>
  );
}

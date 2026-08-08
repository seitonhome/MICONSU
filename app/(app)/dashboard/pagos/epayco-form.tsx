"use client";

import { useActionState, useTransition } from "react";
import { configureEpayco, toggleEpaycoActive, type PaymentsActionState } from "./actions";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";

const initialState: PaymentsActionState = {};

export function EpaycoForm({
  isConfigured,
  isActive,
  isSandbox,
}: {
  isConfigured: boolean;
  isActive: boolean;
  isSandbox: boolean;
}) {
  const [state, formAction, isPending] = useActionState(configureEpayco, initialState);
  const [isToggling, startToggle] = useTransition();

  return (
    <div className="space-y-4">
      {isConfigured && (
        <div className="flex items-center justify-between rounded-lg bg-muted/30 p-3 text-sm">
          <span>ePayco está configurado ({isSandbox ? "modo pruebas" : "producción"}).</span>
          <Switch
            checked={isActive}
            disabled={isToggling}
            onCheckedChange={(checked) => startToggle(() => toggleEpaycoActive(checked))}
          />
        </div>
      )}

      <form action={formAction} className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="public_key">Llave pública</Label>
          <Input id="public_key" name="public_key" placeholder="pk_..." required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="private_key">Llave privada (p_key)</Label>
          <PasswordInput id="private_key" name="private_key" required />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="customer_id">ID de cliente ePayco</Label>
          <Input id="customer_id" name="customer_id" required />
        </div>
        <label className="flex items-center gap-2 text-sm sm:col-span-2">
          <Checkbox name="is_sandbox" defaultChecked={isSandbox} />
          Modo de pruebas (sandbox)
        </label>
        {state?.error && <p className="text-sm text-destructive sm:col-span-2">{state.error}</p>}
        {state?.success && <p className="text-sm text-primary sm:col-span-2">Guardado.</p>}
        <Button type="submit" variant="outline" size="sm" disabled={isPending} className="sm:col-span-2 sm:w-fit">
          {isPending ? "Guardando..." : isConfigured ? "Actualizar credenciales" : "Guardar y activar"}
        </Button>
      </form>
    </div>
  );
}

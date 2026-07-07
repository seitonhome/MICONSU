"use client";

import { useActionState } from "react";
import { configureManualTransfer, type PaymentsActionState } from "./actions";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

const initialState: PaymentsActionState = {};

export function ManualTransferForm({ currentInstructions }: { currentInstructions: string }) {
  const [state, formAction, isPending] = useActionState(configureManualTransfer, initialState);

  return (
    <form action={formAction} className="space-y-3">
      <div className="space-y-2">
        <Label htmlFor="instructions">Instrucciones para tus pacientes</Label>
        <Textarea id="instructions" name="instructions" defaultValue={currentInstructions} rows={3} required />
      </div>
      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
      {state?.success && <p className="text-sm text-primary">Guardado.</p>}
      <Button type="submit" variant="outline" size="sm" disabled={isPending}>
        {isPending ? "Guardando..." : "Guardar"}
      </Button>
    </form>
  );
}

"use client";

import { useActionState, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { configureManualTransfer, configureWompi, type OnboardingActionState } from "../actions";
import { StepShell } from "../_components/step-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import type { Database } from "@/lib/supabase/types";

const initialState: OnboardingActionState = {};

export function Step8Pagos({
  paymentProviders,
}: {
  paymentProviders: Database["public"]["Tables"]["payment_providers"]["Row"][];
}) {
  const [manualState, manualAction, manualPending] = useActionState(configureManualTransfer, initialState);
  const [wompiState, wompiAction, wompiPending] = useActionState(configureWompi, initialState);
  const [showWompi, setShowWompi] = useState(false);

  const manualActive = paymentProviders.some((p) => p.provider_key === "manual_transfer" && p.is_active);
  const wompiActive = paymentProviders.some((p) => p.provider_key === "wompi" && p.is_active);

  return (
    <StepShell
      title="¿Cómo vas a recibir pagos?"
      description="Activa al menos un método. Puedes agregar más pasarelas después desde el Centro de Pagos."
      prevHref="/onboarding/7"
      nextHref="/onboarding/9"
      hideNext={!manualActive && !wompiActive}
    >
      <form action={manualAction} className="space-y-4 rounded-xl border p-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium">Transferencia bancaria</p>
          {manualActive && (
            <span className="flex items-center gap-1 text-xs text-primary">
              <CheckCircle2 className="size-3.5" /> Activo
            </span>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="instructions">Instrucciones para tus pacientes</Label>
          <Textarea
            id="instructions"
            name="instructions"
            placeholder="Ej. Transfiere a la cuenta de ahorros 123-456789 de Bancolombia a nombre de..."
            rows={3}
            required
          />
        </div>
        {manualState?.error && <p className="text-sm text-destructive">{manualState.error}</p>}
        <Button type="submit" variant="outline" disabled={manualPending}>
          {manualPending ? "Guardando..." : manualActive ? "Actualizar instrucciones" : "Activar transferencia manual"}
        </Button>
      </form>

      <div className="rounded-xl border p-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium">Wompi (pagos automáticos con tarjeta, PSE, etc.)</p>
          {wompiActive && (
            <span className="flex items-center gap-1 text-xs text-primary">
              <CheckCircle2 className="size-3.5" /> Activo
            </span>
          )}
        </div>
        {!showWompi && !wompiActive && (
          <Button type="button" variant="link" className="px-0" onClick={() => setShowWompi(true)}>
            Configurar Wompi ahora
          </Button>
        )}
        {(showWompi || wompiActive) && (
          <form action={wompiAction} className="mt-3 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="public_key">Llave pública</Label>
                <Input id="public_key" name="public_key" placeholder="pub_test_..." />
              </div>
              <div className="space-y-2">
                <Label htmlFor="private_key">Llave privada</Label>
                <Input id="private_key" name="private_key" type="password" placeholder="prv_test_..." />
              </div>
              <div className="space-y-2">
                <Label htmlFor="events_secret">Secreto de eventos (opcional)</Label>
                <Input id="events_secret" name="events_secret" type="password" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="integrity_secret">Secreto de integridad (opcional)</Label>
                <Input id="integrity_secret" name="integrity_secret" type="password" />
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox name="is_sandbox" defaultChecked />
              Modo de pruebas (sandbox)
            </label>
            {wompiState?.error && <p className="text-sm text-destructive">{wompiState.error}</p>}
            <Button type="submit" variant="outline" disabled={wompiPending}>
              {wompiPending ? "Guardando..." : "Guardar configuración de Wompi"}
            </Button>
          </form>
        )}
      </div>
    </StepShell>
  );
}

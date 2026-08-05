"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { requestPatientLink, type PatientAuthActionState } from "./actions";

const initialState: PatientAuthActionState = {};

export function PatientLoginForm() {
  const [state, formAction, isPending] = useActionState(requestPatientLink, initialState);

  if (state?.sent) {
    return (
      <p className="rounded-lg bg-secondary px-3 py-2 text-sm text-secondary-foreground">
        Te enviamos un enlace de acceso a tu correo. Ábrelo desde este mismo dispositivo para entrar a tu portal.
      </p>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Correo electrónico</Label>
        <Input id="email" name="email" type="email" placeholder="tu@correo.com" required autoComplete="email" />
      </div>
      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? "Enviando enlace..." : "Enviarme mi enlace de acceso"}
      </Button>
      <p className="text-center text-xs text-muted-foreground">
        Sin contraseñas. Te enviamos un enlace seguro de un solo uso a tu correo.
      </p>
    </form>
  );
}

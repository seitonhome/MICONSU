"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { register } from "./actions";
import type { AuthActionState } from "@/app/login/actions";

const initialState: AuthActionState = {};

export function RegisterForm() {
  const [state, formAction, isPending] = useActionState(register, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="fullName">Tu nombre completo</Label>
        <Input id="fullName" name="fullName" placeholder="Ej. Mariana Duarte" required autoComplete="name" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="clinicName">Nombre de tu consultorio</Label>
        <Input id="clinicName" name="clinicName" placeholder="Ej. Sanación Integral" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">Correo electrónico</Label>
        <Input id="email" name="email" type="email" placeholder="tu@correo.com" required autoComplete="email" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Contraseña</Label>
        <Input id="password" name="password" type="password" required autoComplete="new-password" />
      </div>
      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? "Creando tu consultorio..." : "Crear mi consultorio"}
      </Button>
      <p className="text-center text-sm text-muted-foreground">
        ¿Ya tienes una cuenta?{" "}
        <Link href="/login" className="font-medium text-foreground underline underline-offset-4">
          Ingresa aquí
        </Link>
      </p>
    </form>
  );
}

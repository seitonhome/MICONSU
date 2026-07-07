"use client";

import { useActionState } from "react";
import { updateClinicDetails, type OnboardingActionState } from "../actions";
import { StepShell } from "../_components/step-shell";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import type { Database } from "@/lib/supabase/types";

const initialState: OnboardingActionState = {};

export function Step1Datos({ clinic }: { clinic: Database["public"]["Tables"]["clinics"]["Row"] }) {
  const [state, formAction, isPending] = useActionState(updateClinicDetails, initialState);

  return (
    <form action={formAction}>
      <StepShell
        title="Cuéntanos sobre tu consultorio"
        description="Esta información aparecerá en tu página pública y en tus comunicaciones con pacientes."
        hideNext
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="legal_name">Nombre legal (opcional)</Label>
            <Input id="legal_name" name="legal_name" defaultValue={clinic.legal_name ?? ""} placeholder="Ej. Sanación Integral S.A.S." />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="description">Descripción breve</Label>
            <Textarea
              id="description"
              name="description"
              defaultValue={clinic.description ?? ""}
              placeholder="Ej. Consultorio de acompañamiento terapéutico y bienestar emocional."
              rows={3}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="contact_phone">Teléfono de contacto</Label>
            <Input id="contact_phone" name="contact_phone" defaultValue={clinic.contact_phone ?? ""} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="whatsapp_number">WhatsApp (opcional)</Label>
            <Input id="whatsapp_number" name="whatsapp_number" defaultValue={clinic.whatsapp_number ?? ""} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="contact_email">Correo de contacto (opcional)</Label>
            <Input id="contact_email" name="contact_email" type="email" defaultValue={clinic.contact_email ?? ""} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="website_url">Sitio web (opcional)</Label>
            <Input id="website_url" name="website_url" defaultValue={clinic.website_url ?? ""} />
          </div>
        </div>

        {state?.error && <p className="text-sm text-destructive">{state.error}</p>}

        <div className="flex justify-end border-t pt-6">
          <Button type="submit" disabled={isPending}>
            {isPending ? "Guardando..." : "Continuar"}
          </Button>
        </div>
      </StepShell>
    </form>
  );
}

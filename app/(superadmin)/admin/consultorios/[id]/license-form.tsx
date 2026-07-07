"use client";

import { useActionState } from "react";
import { upsertLicense, type AdminActionState } from "../../actions";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { Database } from "@/lib/supabase/types";

const initialState: AdminActionState = {};

export function LicenseForm({
  clinicId,
  license,
}: {
  clinicId: string;
  license: Database["public"]["Tables"]["licenses"]["Row"] | null;
}) {
  const action = upsertLicense.bind(null, clinicId);
  const [state, formAction, isPending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="grid gap-4 sm:grid-cols-2">
      <div className="space-y-2">
        <Label htmlFor="license_type">Plan</Label>
        <Select name="license_type" defaultValue={license?.license_type ?? "esencial"}>
          <SelectTrigger id="license_type" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="esencial">Esencial</SelectItem>
            <SelectItem value="profesional">Profesional</SelectItem>
            <SelectItem value="centro">Centro</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="status">Estado</Label>
        <Select name="status" defaultValue={license?.status ?? "trial"}>
          <SelectTrigger id="status" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="trial">Prueba</SelectItem>
            <SelectItem value="active">Activa</SelectItem>
            <SelectItem value="suspended">Suspendida</SelectItem>
            <SelectItem value="expired">Vencida</SelectItem>
            <SelectItem value="cancelled">Cancelada</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="professionals_allowed">Profesionales permitidos</Label>
        <Input id="professionals_allowed" name="professionals_allowed" type="number" min={1} defaultValue={license?.professionals_allowed ?? 1} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="locations_allowed">Sedes permitidas</Label>
        <Input id="locations_allowed" name="locations_allowed" type="number" min={1} defaultValue={license?.locations_allowed ?? 1} />
      </div>
      <div className="space-y-2 sm:col-span-2">
        <Label htmlFor="internal_notes">Notas internas</Label>
        <Textarea id="internal_notes" name="internal_notes" defaultValue={license?.internal_notes ?? ""} rows={2} />
      </div>

      {state?.error && <p className="text-sm text-destructive sm:col-span-2">{state.error}</p>}

      <Button type="submit" variant="outline" size="sm" disabled={isPending} className="sm:w-fit">
        {isPending ? "Guardando..." : "Guardar licencia"}
      </Button>
    </form>
  );
}

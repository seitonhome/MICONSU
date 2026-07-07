"use client";

import { useActionState } from "react";
import { upsertSupportSubscription, type AdminActionState } from "../../actions";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Database } from "@/lib/supabase/types";

const initialState: AdminActionState = {};

export function SupportSubscriptionForm({
  clinicId,
  subscription,
  planKey,
}: {
  clinicId: string;
  subscription: Database["public"]["Tables"]["support_subscriptions"]["Row"] | null;
  planKey: string;
}) {
  const action = upsertSupportSubscription.bind(null, clinicId);
  const [state, formAction, isPending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="grid gap-4 sm:grid-cols-2">
      <div className="space-y-2">
        <Label htmlFor="plan_key">Plan de soporte</Label>
        <Select name="plan_key" defaultValue={planKey}>
          <SelectTrigger id="plan_key" className="w-full">
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
        <Select name="status" defaultValue={subscription?.status ?? "active"}>
          <SelectTrigger id="status" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="active">Activo</SelectItem>
            <SelectItem value="expiring_soon">Por vencer</SelectItem>
            <SelectItem value="expired">Vencido</SelectItem>
            <SelectItem value="suspended">Suspendido</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2 sm:col-span-2">
        <Label htmlFor="ends_at">Vence el</Label>
        <Input id="ends_at" name="ends_at" type="date" defaultValue={subscription?.ends_at ?? ""} />
      </div>

      {state?.error && <p className="text-sm text-destructive sm:col-span-2">{state.error}</p>}

      <Button type="submit" variant="outline" size="sm" disabled={isPending} className="sm:w-fit">
        {isPending ? "Guardando..." : "Guardar soporte"}
      </Button>
    </form>
  );
}

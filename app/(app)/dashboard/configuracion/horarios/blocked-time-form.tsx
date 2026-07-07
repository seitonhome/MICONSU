"use client";

import { useActionState } from "react";
import { Trash2 } from "lucide-react";
import { addBlockedTime, deleteBlockedTime, type ScheduleActionState } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Database } from "@/lib/supabase/types";

const initialState: ScheduleActionState = {};

export function BlockedTimeForm({
  professionals,
  blockedTimes,
}: {
  professionals: Database["public"]["Tables"]["professionals"]["Row"][];
  blockedTimes: Database["public"]["Tables"]["blocked_times"]["Row"][];
}) {
  const [state, formAction, isPending] = useActionState(addBlockedTime, initialState);
  const professionalName = (id: string | null) =>
    id ? (professionals.find((p) => p.id === id)?.full_name ?? "—") : "Todo el consultorio";

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Bloqueos y vacaciones</h2>
      <p className="text-sm text-muted-foreground">
        Bloquea un rango de fechas u horas para un profesional (vacaciones, incapacidad) o para todo el consultorio.
      </p>

      {blockedTimes.length > 0 && (
        <ul className="divide-y rounded-xl border">
          {blockedTimes.map((bt) => (
            <li key={bt.id} className="flex items-center justify-between px-4 py-3">
              <p className="text-sm">
                <span className="font-medium">{professionalName(bt.professional_id)}</span> ·{" "}
                {new Date(bt.starts_at).toLocaleString("es-CO")} — {new Date(bt.ends_at).toLocaleString("es-CO")}
                {bt.reason ? ` · ${bt.reason}` : ""}
              </p>
              <form action={deleteBlockedTime.bind(null, bt.id)}>
                <Button type="submit" variant="ghost" size="icon" aria-label="Eliminar">
                  <Trash2 className="size-4" />
                </Button>
              </form>
            </li>
          ))}
        </ul>
      )}

      <form action={formAction} className="space-y-4 rounded-xl border p-4">
        <div className="space-y-2">
          <Label htmlFor="professional_id">Profesional</Label>
          <Select name="professional_id">
            <SelectTrigger id="professional_id" className="w-full sm:w-64">
              <SelectValue placeholder="Todo el consultorio" />
            </SelectTrigger>
            <SelectContent>
              {professionals.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.full_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-4 sm:max-w-lg sm:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="date">Fecha</Label>
            <Input id="date" name="date" type="date" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="start_time">Desde</Label>
            <Input id="start_time" name="start_time" type="time" defaultValue="00:00" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="end_time">Hasta</Label>
            <Input id="end_time" name="end_time" type="time" defaultValue="23:59" required />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="reason">Motivo (opcional)</Label>
          <Input id="reason" name="reason" placeholder="Ej. Vacaciones" />
        </div>

        {state?.error && <p className="text-sm text-destructive">{state.error}</p>}

        <Button type="submit" variant="outline" disabled={isPending}>
          {isPending ? "Guardando..." : "Agregar bloqueo"}
        </Button>
      </form>
    </div>
  );
}

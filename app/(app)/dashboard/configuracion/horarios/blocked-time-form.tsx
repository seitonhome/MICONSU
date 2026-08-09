"use client";

import { useActionState, useState } from "react";
import { Trash2 } from "lucide-react";
import { addBlockedTime, deleteBlockedTime, type ScheduleActionState } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { WEEKDAY_LABELS } from "@/lib/domain/labels";
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
  const [isRecurring, setIsRecurring] = useState(false);
  const professionalName = (id: string | null) =>
    id ? (professionals.find((p) => p.id === id)?.full_name ?? "—") : "Todo el consultorio";

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Bloqueos y vacaciones</h2>
      <p className="text-sm text-muted-foreground">
        Bloquea un rango de fechas u horas puntual (vacaciones, incapacidad), o un bloqueo que se repite cada semana
        (ej. &ldquo;todos los miércoles no atiendo&rdquo;), para un profesional o para todo el consultorio.
      </p>

      {blockedTimes.length > 0 && (
        <ul className="divide-y divide-black/[0.06] overflow-hidden rounded-[16px] border border-black/[0.07] bg-card">
          {blockedTimes.map((bt) => (
            <li key={bt.id} className="flex items-center justify-between px-4 py-3">
              <p className="text-sm">
                <span className="font-medium">{professionalName(bt.professional_id)}</span> ·{" "}
                {bt.is_recurring ? (
                  <>
                    Todos los {WEEKDAY_LABELS[bt.day_of_week ?? 0]?.toLowerCase()} · {bt.start_time?.slice(0, 5)} —{" "}
                    {bt.end_time?.slice(0, 5)}
                    {bt.recurrence_ends_at ? ` · hasta ${new Date(bt.recurrence_ends_at).toLocaleDateString("es-CO")}` : " · indefinido"}
                  </>
                ) : (
                  <>
                    {new Date(bt.starts_at).toLocaleString("es-CO")} — {bt.ends_at ? new Date(bt.ends_at).toLocaleString("es-CO") : ""}
                  </>
                )}
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
              <SelectValue placeholder="Todo el consultorio">{(value: string) => professionalName(value)}</SelectValue>
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

        <label className="flex items-center gap-2 text-sm">
          <Checkbox
            name="is_recurring"
            checked={isRecurring}
            onCheckedChange={(checked) => setIsRecurring(checked === true)}
          />
          Se repite cada semana
        </label>

        {isRecurring ? (
          <div className="grid gap-4 sm:max-w-3xl sm:grid-cols-5">
            <div className="space-y-2">
              <Label htmlFor="day_of_week">Día</Label>
              <Select name="day_of_week" defaultValue="3">
                <SelectTrigger id="day_of_week" className="w-full">
                  <SelectValue>{(value: string) => WEEKDAY_LABELS[Number(value)] ?? value}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {WEEKDAY_LABELS.map((label, index) => (
                    <SelectItem key={index} value={String(index)}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="recurring_start_time">Desde (hora)</Label>
              <Input id="recurring_start_time" name="recurring_start_time" type="time" defaultValue="00:00" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="recurring_end_time">Hasta (hora)</Label>
              <Input id="recurring_end_time" name="recurring_end_time" type="time" defaultValue="23:59" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="recurrence_from">Vigente desde</Label>
              <Input id="recurrence_from" name="recurrence_from" type="date" defaultValue={new Date().toISOString().slice(0, 10)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="recurrence_until">Vigente hasta (opcional)</Label>
              <Input id="recurrence_until" name="recurrence_until" type="date" />
            </div>
          </div>
        ) : (
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
        )}

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

"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { fetchRescheduleSlotsAction, reschedulePublicAppointment } from "./actions";

export function RescheduleBookingForm({ token }: { token: string }) {
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState("");
  const [slots, setSlots] = useState<string[]>([]);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleDateChange(value: string) {
    setDate(value);
    setSelectedTime(null);
    setSlots([]);
    if (!value) return;
    startTransition(async () => {
      const result = await fetchRescheduleSlotsAction(token, value);
      setSlots(result);
    });
  }

  function handleConfirm() {
    if (!date || !selectedTime) return;
    setError(null);
    startTransition(async () => {
      const result = await reschedulePublicAppointment(token, date, selectedTime);
      if (result.error) {
        setError(result.error);
        return;
      }
      setSuccess(true);
    });
  }

  if (success) {
    return <p className="text-center text-sm text-primary">Tu cita fue reprogramada. Revisa tu correo para la confirmación.</p>;
  }

  if (!open) {
    return (
      <Button type="button" variant="outline" className="w-full" onClick={() => setOpen(true)}>
        Reprogramar mi cita
      </Button>
    );
  }

  return (
    <div className="space-y-3 rounded-xl border p-4">
      <div className="space-y-2">
        <label htmlFor="reschedule-date" className="text-xs text-muted-foreground">
          Elige una nueva fecha
        </label>
        <Input
          id="reschedule-date"
          type="date"
          value={date}
          min={new Date().toISOString().slice(0, 10)}
          onChange={(e) => handleDateChange(e.target.value)}
        />
      </div>

      {date && (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">Horarios disponibles</p>
          {isPending && slots.length === 0 ? (
            <p className="text-xs text-muted-foreground">Buscando horarios...</p>
          ) : slots.length === 0 ? (
            <p className="text-xs text-muted-foreground">No hay horarios libres ese día. Prueba otra fecha.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {slots.map((time) => (
                <Button
                  key={time}
                  type="button"
                  size="sm"
                  variant={selectedTime === time ? "default" : "outline"}
                  onClick={() => setSelectedTime(time)}
                >
                  {time}
                </Button>
              ))}
            </div>
          )}
        </div>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex justify-end gap-2 border-t pt-3">
        <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)} disabled={isPending}>
          Cancelar
        </Button>
        <Button type="button" size="sm" onClick={handleConfirm} disabled={isPending || !selectedTime}>
          {isPending ? "Guardando..." : "Confirmar nuevo horario"}
        </Button>
      </div>
    </div>
  );
}

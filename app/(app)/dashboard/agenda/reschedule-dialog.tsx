"use client";

import { useState, useTransition } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { rescheduleAppointment } from "./actions";

export function RescheduleDialog({ id, open, onOpenChange }: { id: string; open: boolean; onOpenChange: (open: boolean) => void }) {
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit() {
    if (!date || !time) return;
    setError(null);
    startTransition(async () => {
      const result = await rescheduleAppointment(id, date, time);
      if (result.error) {
        setError(result.error);
        return;
      }
      onOpenChange(false);
      setDate("");
      setTime("");
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Reprogramar cita</DialogTitle>
          <DialogDescription>El paciente recibe un correo con la nueva fecha y hora.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="reschedule-date">Nueva fecha</Label>
              <Input id="reschedule-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reschedule-time">Nueva hora</Label>
              <Input id="reschedule-time" type="time" value={time} onChange={(e) => setTime(e.target.value)} />
            </div>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex justify-end border-t pt-4">
            <Button onClick={handleSubmit} disabled={isPending || !date || !time}>
              {isPending ? "Reprogramando..." : "Reprogramar"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

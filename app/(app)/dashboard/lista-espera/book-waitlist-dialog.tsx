"use client";

import { useState, useTransition } from "react";
import { CalendarPlus } from "lucide-react";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { bookWaitlistEntry } from "./actions";
import type { Database } from "@/lib/supabase/types";

type Professional = Database["public"]["Tables"]["professionals"]["Row"];
type Service = Database["public"]["Tables"]["services"]["Row"];

export function BookWaitlistDialog({
  id,
  patientName,
  preferredProfessionalId,
  preferredServiceId,
  professionals,
  services,
  open,
  onOpenChange,
}: {
  id: string;
  patientName: string;
  preferredProfessionalId: string | null;
  preferredServiceId: string | null;
  professionals: Professional[];
  services: Service[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [professionalId, setProfessionalId] = useState(preferredProfessionalId ?? professionals[0]?.id ?? "");
  const [serviceId, setServiceId] = useState(preferredServiceId ?? services[0]?.id ?? "");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit() {
    if (!professionalId || !serviceId || !date || !time) return;
    setError(null);
    startTransition(async () => {
      const result = await bookWaitlistEntry(id, professionalId, serviceId, date, time);
      if (result.error) {
        setError(result.error);
        return;
      }
      onOpenChange(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Crear cita para {patientName}</DialogTitle>
          <DialogDescription>Se marca como &ldquo;reservó&rdquo; en la lista de espera y se crea la cita real en Agenda.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="wl-professional">Profesional</Label>
            <Select value={professionalId} onValueChange={(value) => setProfessionalId(value ?? "")}>
              <SelectTrigger id="wl-professional" className="w-full">
                <SelectValue>{(value: string) => professionals.find((p) => p.id === value)?.full_name ?? value}</SelectValue>
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
          <div className="space-y-2">
            <Label htmlFor="wl-service">Servicio</Label>
            <Select value={serviceId} onValueChange={(value) => setServiceId(value ?? "")}>
              <SelectTrigger id="wl-service" className="w-full">
                <SelectValue>{(value: string) => services.find((s) => s.id === value)?.name ?? value}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {services.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="wl-date">Fecha</Label>
              <Input id="wl-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="wl-time">Hora</Label>
              <Input id="wl-time" type="time" value={time} onChange={(e) => setTime(e.target.value)} />
            </div>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex justify-end border-t pt-4">
            <Button onClick={handleSubmit} disabled={isPending || !professionalId || !serviceId || !date || !time}>
              <CalendarPlus className="size-4" />
              {isPending ? "Creando..." : "Crear cita"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

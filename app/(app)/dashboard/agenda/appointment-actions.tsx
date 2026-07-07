"use client";

import { useTransition } from "react";
import { MoreVertical } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { updateAppointmentStatus, cancelAppointment } from "./actions";
import type { Database } from "@/lib/supabase/types";

type Status = Database["public"]["Enums"]["appointment_status"];

const NEXT_ACTIONS: Partial<Record<Status, { label: string; next: Status }[]>> = {
  requested: [{ label: "Confirmar", next: "confirmed" }],
  pending_payment: [{ label: "Confirmar", next: "confirmed" }],
  pending_manual_confirmation: [{ label: "Confirmar", next: "confirmed" }],
  confirmed: [
    { label: "Registrar llegada (check-in)", next: "checked_in" },
    { label: "Marcar no asistió", next: "no_show" },
  ],
  checked_in: [{ label: "Iniciar atención", next: "in_progress" }],
  in_progress: [{ label: "Marcar completada", next: "completed" }],
};

export function AppointmentActions({ id, status }: { id: string; status: Status }) {
  const [isPending, startTransition] = useTransition();
  const actions = NEXT_ACTIONS[status] ?? [];
  const canCancel = !["completed", "cancelled", "no_show", "expired"].includes(status);

  if (actions.length === 0 && !canCancel) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="ghost" size="icon" disabled={isPending} />}>
        <MoreVertical className="size-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        {actions.map((action) => (
          <DropdownMenuItem
            key={action.next}
            onClick={() => startTransition(() => updateAppointmentStatus(id, action.next))}
          >
            {action.label}
          </DropdownMenuItem>
        ))}
        {canCancel && (
          <DropdownMenuItem
            variant="destructive"
            onClick={() => {
              const reason = window.prompt("Motivo de la cancelación (opcional):") ?? "";
              startTransition(() => cancelAppointment(id, reason));
            }}
          >
            Cancelar cita
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

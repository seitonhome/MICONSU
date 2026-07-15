"use client";

import { useTransition } from "react";
import { Check, DollarSign, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { updateAttendee, removeAttendee } from "../actions";

const PAYMENT_LABELS = { pending: "Pendiente", paid: "Pagado", waived: "Exonerado" } as const;

export function AttendeeRow({
  groupSessionId,
  attendee,
  patientName,
}: {
  groupSessionId: string;
  attendee: { id: string; attended: boolean; payment_status: "pending" | "paid" | "waived" };
  patientName: string;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <li className="flex items-center justify-between gap-4 px-4 py-3">
      <div className="flex min-w-0 items-center gap-2">
        <p className="truncate text-sm font-medium">{patientName}</p>
        <Badge variant={attendee.payment_status === "paid" ? "default" : "outline"}>
          {PAYMENT_LABELS[attendee.payment_status]}
        </Badge>
        {attendee.attended && <Badge variant="secondary">Asistió</Badge>}
      </div>
      <div className="flex shrink-0 items-center gap-1">
        {attendee.payment_status !== "paid" && (
          <Button
            variant="ghost"
            size="icon"
            aria-label="Marcar pagado"
            disabled={isPending}
            onClick={() =>
              startTransition(() => updateAttendee(groupSessionId, attendee.id, { payment_status: "paid" }))
            }
          >
            <DollarSign className="size-4" />
          </Button>
        )}
        {!attendee.attended && (
          <Button
            variant="ghost"
            size="icon"
            aria-label="Marcar asistencia"
            disabled={isPending}
            onClick={() => startTransition(() => updateAttendee(groupSessionId, attendee.id, { attended: true }))}
          >
            <Check className="size-4" />
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon"
          aria-label="Quitar inscrito"
          disabled={isPending}
          onClick={() => startTransition(() => removeAttendee(groupSessionId, attendee.id))}
        >
          <Trash2 className="size-4" />
        </Button>
      </div>
    </li>
  );
}

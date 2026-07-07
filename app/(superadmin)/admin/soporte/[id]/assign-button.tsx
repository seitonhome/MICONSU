"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { assignTicketToSelf } from "../../actions";

export function AssignButton({ ticketId, alreadyAssigned }: { ticketId: string; alreadyAssigned: boolean }) {
  const [isPending, startTransition] = useTransition();

  if (alreadyAssigned) return null;

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      disabled={isPending}
      onClick={() => startTransition(() => assignTicketToSelf(ticketId))}
    >
      {isPending ? "Asignando..." : "Asignarme este ticket"}
    </Button>
  );
}

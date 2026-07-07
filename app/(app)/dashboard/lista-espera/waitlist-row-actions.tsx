"use client";

import { useTransition } from "react";
import { Bell, Check, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { markWaitlistStatus, deleteWaitlistEntry } from "./actions";

export function WaitlistRowActions({ id }: { id: string }) {
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex shrink-0 items-center gap-1">
      <Button
        variant="ghost"
        size="icon"
        aria-label="Marcar como notificado"
        disabled={isPending}
        onClick={() => startTransition(() => markWaitlistStatus(id, "notified"))}
      >
        <Bell className="size-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        aria-label="Marcar como reservado"
        disabled={isPending}
        onClick={() => startTransition(() => markWaitlistStatus(id, "booked"))}
      >
        <Check className="size-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        aria-label="Eliminar"
        disabled={isPending}
        onClick={() => startTransition(() => deleteWaitlistEntry(id))}
      >
        <Trash2 className="size-4" />
      </Button>
    </div>
  );
}

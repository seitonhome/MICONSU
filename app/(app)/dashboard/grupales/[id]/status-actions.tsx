"use client";

import { useTransition } from "react";
import { CheckCheck, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { updateGroupSessionStatus } from "../actions";

export function GroupSessionStatusActions({
  id,
  status,
}: {
  id: string;
  status: "scheduled" | "completed" | "cancelled";
}) {
  const [isPending, startTransition] = useTransition();

  if (status !== "scheduled") return null;

  return (
    <div className="flex shrink-0 items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        disabled={isPending}
        onClick={() => startTransition(() => updateGroupSessionStatus(id, "completed"))}
      >
        <CheckCheck className="size-4" />
        Marcar realizado
      </Button>
      <Button
        variant="outline"
        size="sm"
        disabled={isPending}
        onClick={() => startTransition(() => updateGroupSessionStatus(id, "cancelled"))}
      >
        <XCircle className="size-4" />
        Cancelar
      </Button>
    </div>
  );
}

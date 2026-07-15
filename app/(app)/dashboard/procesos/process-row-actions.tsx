"use client";

import { useTransition } from "react";
import { CheckCheck, Pause, Play, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { updateProcessStatus } from "./actions";
import { ProcessNoteDialog } from "./process-note-dialog";

export function ProcessRowActions({
  id,
  status,
}: {
  id: string;
  status: "active" | "paused" | "completed" | "abandoned" | "cancelled";
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex shrink-0 items-center gap-1">
      {status === "active" && <ProcessNoteDialog id={id} />}
      {status === "active" && (
        <Button
          variant="ghost"
          size="icon"
          aria-label="Pausar"
          disabled={isPending}
          onClick={() => startTransition(() => updateProcessStatus(id, "paused"))}
        >
          <Pause className="size-4" />
        </Button>
      )}
      {status === "paused" && (
        <Button
          variant="ghost"
          size="icon"
          aria-label="Reanudar"
          disabled={isPending}
          onClick={() => startTransition(() => updateProcessStatus(id, "active"))}
        >
          <Play className="size-4" />
        </Button>
      )}
      {(status === "active" || status === "paused") && (
        <>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Marcar completado"
            disabled={isPending}
            onClick={() => startTransition(() => updateProcessStatus(id, "completed"))}
          >
            <CheckCheck className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Marcar abandonado"
            disabled={isPending}
            onClick={() => startTransition(() => updateProcessStatus(id, "abandoned"))}
          >
            <XCircle className="size-4" />
          </Button>
        </>
      )}
    </div>
  );
}

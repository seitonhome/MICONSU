"use client";

import { useState, useTransition } from "react";
import { Check, Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { updateFollowupStatus, sendFollowupNow } from "./actions";

export function FollowupRowActions({ id, status }: { id: string; status: "pending" | "sent" | "completed" | "skipped" }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSend() {
    setError(null);
    startTransition(async () => {
      const result = await sendFollowupNow(id);
      if (result.error) setError(result.error);
    });
  }

  if (status !== "pending" && status !== "sent") return null;

  return (
    <div className="flex shrink-0 flex-col items-end gap-1">
      <div className="flex items-center gap-1">
        {status === "pending" && (
          <Button variant="ghost" size="icon" aria-label="Enviar por correo" disabled={isPending} onClick={handleSend}>
            <Send className="size-4" />
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon"
          aria-label="Marcar completado"
          disabled={isPending}
          onClick={() => startTransition(() => updateFollowupStatus(id, "completed"))}
        >
          <Check className="size-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Omitir"
          disabled={isPending}
          onClick={() => startTransition(() => updateFollowupStatus(id, "skipped"))}
        >
          <X className="size-4" />
        </Button>
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

"use client";

import { useTransition } from "react";
import { Check, Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { updateFollowupStatus } from "./actions";

export function FollowupRowActions({ id, status }: { id: string; status: "pending" | "sent" | "completed" | "skipped" }) {
  const [isPending, startTransition] = useTransition();

  if (status !== "pending" && status !== "sent") return null;

  return (
    <div className="flex shrink-0 items-center gap-1">
      {status === "pending" && (
        <Button
          variant="ghost"
          size="icon"
          aria-label="Marcar enviado"
          disabled={isPending}
          onClick={() => startTransition(() => updateFollowupStatus(id, "sent"))}
        >
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
  );
}

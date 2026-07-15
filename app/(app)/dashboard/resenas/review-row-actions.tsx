"use client";

import { useTransition } from "react";
import { Star, EyeOff, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { updateReviewStatus } from "./actions";

export function ReviewRowActions({ id, status }: { id: string; status: "private" | "approved" | "featured" }) {
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex shrink-0 items-center gap-1">
      {status !== "approved" && (
        <Button
          variant="ghost"
          size="icon"
          aria-label="Aprobar para página pública"
          disabled={isPending}
          onClick={() => startTransition(() => updateReviewStatus(id, "approved"))}
        >
          <Star className="size-4" />
        </Button>
      )}
      {status !== "featured" && (
        <Button
          variant="ghost"
          size="icon"
          aria-label="Destacar"
          disabled={isPending}
          onClick={() => startTransition(() => updateReviewStatus(id, "featured"))}
        >
          <Sparkles className="size-4" />
        </Button>
      )}
      {status !== "private" && (
        <Button
          variant="ghost"
          size="icon"
          aria-label="Ocultar (dejar privada)"
          disabled={isPending}
          onClick={() => startTransition(() => updateReviewStatus(id, "private"))}
        >
          <EyeOff className="size-4" />
        </Button>
      )}
    </div>
  );
}

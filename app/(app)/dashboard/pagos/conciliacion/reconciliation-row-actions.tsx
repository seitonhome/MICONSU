"use client";

import { useTransition } from "react";
import { Check, X, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { confirmPayment, rejectPayment, markUnderReview } from "./actions";

export function ReconciliationRowActions({ id }: { id: string }) {
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex shrink-0 items-center gap-1">
      <Button
        variant="ghost"
        size="icon"
        aria-label="Confirmar"
        disabled={isPending}
        onClick={() => startTransition(() => confirmPayment(id))}
      >
        <Check className="size-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        aria-label="Marcar en revisión"
        disabled={isPending}
        onClick={() => startTransition(() => markUnderReview(id))}
      >
        <Search className="size-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        aria-label="Rechazar"
        disabled={isPending}
        onClick={() => startTransition(() => rejectPayment(id))}
      >
        <X className="size-4" />
      </Button>
    </div>
  );
}

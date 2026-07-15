"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { deactivateResource } from "./actions";

export function DeactivateButton({ id }: { id: string }) {
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label="Quitar de la biblioteca"
      disabled={isPending}
      onClick={() => startTransition(() => deactivateResource(id))}
    >
      <Trash2 className="size-4" />
    </Button>
  );
}

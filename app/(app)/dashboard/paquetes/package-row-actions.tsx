"use client";

import { useTransition } from "react";
import { CheckCheck, Pause, Play, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { registerPackageSession, updatePackageStatus } from "./actions";

export function PackageRowActions({
  id,
  status,
  isComplete,
}: {
  id: string;
  status: "active" | "completed" | "paused" | "expired" | "cancelled";
  isComplete: boolean;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex shrink-0 items-center gap-1">
      {status === "active" && !isComplete && (
        <Button
          size="sm"
          variant="outline"
          disabled={isPending}
          onClick={() => startTransition(() => registerPackageSession(id))}
        >
          Registrar sesión
        </Button>
      )}
      {status === "active" && (
        <Button
          variant="ghost"
          size="icon"
          aria-label="Pausar"
          disabled={isPending}
          onClick={() => startTransition(() => updatePackageStatus(id, "paused"))}
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
          onClick={() => startTransition(() => updatePackageStatus(id, "active"))}
        >
          <Play className="size-4" />
        </Button>
      )}
      {status !== "completed" && status !== "cancelled" && (
        <Button
          variant="ghost"
          size="icon"
          aria-label="Marcar completado"
          disabled={isPending}
          onClick={() => startTransition(() => updatePackageStatus(id, "completed"))}
        >
          <CheckCheck className="size-4" />
        </Button>
      )}
      {status !== "cancelled" && status !== "completed" && (
        <Button
          variant="ghost"
          size="icon"
          aria-label="Cancelar"
          disabled={isPending}
          onClick={() => startTransition(() => updatePackageStatus(id, "cancelled"))}
        >
          <XCircle className="size-4" />
        </Button>
      )}
    </div>
  );
}

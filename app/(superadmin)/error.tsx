"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function SuperadminError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 rounded-2xl border border-dashed p-10 text-center">
      <AlertTriangle className="size-8 text-muted-foreground" />
      <h2 className="text-lg font-semibold">No pudimos cargar esta sección</h2>
      <p className="max-w-sm text-sm text-muted-foreground">Intenta de nuevo en unos segundos.</p>
      <Button variant="outline" onClick={() => reset()}>
        Intentar de nuevo
      </Button>
    </div>
  );
}

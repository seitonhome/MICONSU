"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 px-4 text-center">
      <AlertTriangle className="size-8 text-muted-foreground" />
      <h1 className="text-xl font-semibold">Algo salió mal</h1>
      <p className="max-w-sm text-sm text-muted-foreground">
        Tuvimos un problema al cargar esta página. Intenta de nuevo — si sigue pasando, contáctanos desde Soporte.
      </p>
      <Button className="mt-2" onClick={() => reset()}>
        Intentar de nuevo
      </Button>
    </div>
  );
}

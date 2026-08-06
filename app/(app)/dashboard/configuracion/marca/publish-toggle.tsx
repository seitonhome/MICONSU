"use client";

import { useTransition } from "react";
import { Globe, ExternalLink } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { setClinicPublished } from "./actions";

export function PublishToggle({ isPublished, publicUrl }: { isPublished: boolean; publicUrl: string }) {
  const [isPending, startTransition] = useTransition();

  return (
    <Card>
      <CardHeader>
        <Globe className="size-5 text-primary" />
        <CardTitle className="mt-2 text-base">
          {isPublished ? "Tu página pública está activa" : "Tu página pública aún no está publicada"}
        </CardTitle>
        <CardDescription>
          {isPublished
            ? "Cualquier persona con el link puede ver tus servicios y reservar."
            : "Nadie puede ver tu página ni reservar hasta que la publiques."}
        </CardDescription>
      </CardHeader>
      <div className="flex flex-wrap items-center gap-2 px-6 pb-6">
        {isPublished && (
          <Button variant="outline" render={<a href={publicUrl} target="_blank" rel="noreferrer" />}>
            <ExternalLink className="size-4" />
            Ver mi página
          </Button>
        )}
        <Button
          variant={isPublished ? "outline" : "default"}
          disabled={isPending}
          onClick={() => startTransition(() => setClinicPublished(!isPublished))}
        >
          {isPending ? "Guardando..." : isPublished ? "Despublicar" : "Publicar mi página"}
        </Button>
      </div>
    </Card>
  );
}

import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { StepShell } from "../_components/step-shell";
import { Button } from "@/components/ui/button";

export function Step10PaginaPublica({ slug, appUrl }: { slug: string; appUrl: string }) {
  const publicUrl = `${appUrl}/c/${slug}`;

  return (
    <StepShell
      title="Esta es tu página pública"
      description="Aquí es donde tus pacientes o consultantes van a conocerte y reservar. Se actualiza automáticamente con todo lo que configuraste."
      prevHref="/onboarding/9"
      nextHref="/onboarding/11"
    >
      <div className="rounded-xl border bg-muted/30 p-4">
        <p className="text-sm text-muted-foreground">Tu link de reservas</p>
        <p className="mt-1 break-all font-mono text-sm">{publicUrl}</p>
      </div>

      <Button variant="outline" render={<Link href={`/c/${slug}`} target="_blank" />}>
        Ver mi página pública
        <ExternalLink className="size-4" />
      </Button>

      <p className="text-sm text-muted-foreground">
        Nota: tu página estará visible al público solo cuando la publiques, en el último paso.
      </p>
    </StepShell>
  );
}

import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { StepShell } from "../_components/step-shell";
import { Button } from "@/components/ui/button";

export function Step11PruebaReserva({ slug }: { slug: string }) {
  return (
    <StepShell
      title="Prueba tu flujo de reserva"
      description="Antes de publicar, te recomendamos hacer una reserva de prueba como si fueras un paciente, para revisar que todo se vea y funcione como esperas."
      prevHref="/onboarding/10"
      nextHref="/onboarding/12"
    >
      <div className="space-y-3 rounded-xl border p-4 text-sm">
        <p className="font-medium">Qué revisar en tu prueba:</p>
        <ul className="list-inside list-disc space-y-1 text-muted-foreground">
          <li>Que tus servicios, precios y duración se vean correctos.</li>
          <li>Que los horarios disponibles coincidan con los que configuraste.</li>
          <li>Que el consentimiento y la política de datos aparezcan antes de confirmar.</li>
          <li>Que el resumen de la cita y el método de pago sean claros.</li>
        </ul>
      </div>

      <Button variant="outline" render={<Link href={`/c/${slug}`} target="_blank" />}>
        Abrir mi página de reservas
        <ExternalLink className="size-4" />
      </Button>
    </StepShell>
  );
}

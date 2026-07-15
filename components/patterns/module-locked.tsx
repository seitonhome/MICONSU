import Link from "next/link";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { LicenseType } from "@/lib/modules";
import { PLAN_LABELS } from "@/lib/modules";

export function ModuleLocked({
  title,
  requiredPlan,
  moduleLabel,
}: {
  title: string;
  requiredPlan: LicenseType;
  moduleLabel?: string;
}) {
  return (
    <div className="rounded-2xl border border-dashed p-10 text-center">
      <Lock className="mx-auto size-8 text-muted-foreground" />
      <p className="mt-3 font-medium">{title}</p>
      <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
        {moduleLabel
          ? `${moduleLabel} está disponible como módulo adicional desde ${PLAN_LABELS[requiredPlan]}.`
          : `Esta función está disponible desde ${PLAN_LABELS[requiredPlan]}.`}{" "}
        Contacta a soporte para activarlo en tu consultorio.
      </p>
      <Button className="mt-4" variant="outline" render={<Link href="/dashboard/soporte" />}>
        Hablar con soporte
      </Button>
    </div>
  );
}

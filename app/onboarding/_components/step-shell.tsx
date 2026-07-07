import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function StepShell({
  title,
  description,
  children,
  prevHref,
  nextHref,
  nextLabel = "Continuar",
  hideNext = false,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
  prevHref?: string;
  nextHref?: string;
  nextLabel?: string;
  hideNext?: boolean;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">{title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>

      {children}

      {(prevHref || (!hideNext && nextHref)) && (
        <div className="flex items-center justify-between border-t pt-6">
          {prevHref ? (
            <Button variant="outline" render={<Link href={prevHref} />}>
              <ChevronLeft className="size-4" />
              Atrás
            </Button>
          ) : (
            <span />
          )}
          {!hideNext && nextHref && (
            <Button render={<Link href={nextHref} />}>
              {nextLabel}
              <ChevronRight className="size-4" />
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

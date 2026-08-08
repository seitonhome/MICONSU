import Link from "next/link";
import { CircleCheck } from "lucide-react";
import { ONBOARDING_STEPS } from "@/app/onboarding/_lib/steps";
import type { StepCompletion } from "@/app/onboarding/_lib/context";

export function ActivationChecklist({ completion, percent }: { completion: StepCompletion; percent: number }) {
  const pending = ONBOARDING_STEPS.filter((s) => !completion[s.id]);
  if (pending.length === 0) return null;

  return (
    <div className="rounded-2xl border border-dashed p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-medium">
          Tu consultorio está {percent}% configurado — {pending.length} paso{pending.length === 1 ? "" : "s"} por terminar.
        </p>
        <Link href={`/onboarding/${pending[0].id}`} className="text-sm font-medium text-primary underline underline-offset-4">
          Continuar configuración
        </Link>
      </div>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${percent}%` }} />
      </div>
      <ul className="mt-3 flex flex-wrap gap-2">
        {ONBOARDING_STEPS.map((s) => {
          const done = completion[s.id];
          return (
            <li key={s.id}>
              <Link
                href={`/onboarding/${s.id}`}
                className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition-colors ${
                  done ? "border-transparent bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary"
                }`}
              >
                {done && <CircleCheck className="size-3" />}
                {s.shortTitle}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

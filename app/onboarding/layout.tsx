import Link from "next/link";
import { CheckCircle2, Circle } from "lucide-react";
import { getOnboardingContext, computeStepCompletion, progressPercent } from "./_lib/context";
import { ONBOARDING_STEPS } from "./_lib/steps";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

export default async function OnboardingLayout({ children }: { children: React.ReactNode }) {
  const ctx = await getOnboardingContext();
  const completion = computeStepCompletion(ctx);
  const percent = progressPercent(completion);

  return (
    <div className="min-h-screen bg-muted/20">
      <header className="border-b bg-background">
        <div className="mx-auto max-w-5xl px-4 py-5 md:px-8">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Mi Consultorio Pro
          </p>
          <h1 className="mt-1 text-lg font-semibold">{ctx.clinic.commercial_name}</h1>
          <div className="mt-4 flex items-center gap-3">
            <Progress value={percent} className="h-2 flex-1" />
            <span className="whitespace-nowrap text-sm font-medium text-muted-foreground">
              {percent}% configurado
            </span>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-5xl flex-col gap-8 px-4 py-8 md:flex-row md:px-8">
        <nav className="shrink-0 md:w-56">
          <ol className="flex gap-2 overflow-x-auto pb-2 md:flex-col md:overflow-visible md:pb-0">
            {ONBOARDING_STEPS.map((step) => {
              const done = completion[step.id];
              return (
                <li key={step.id} className="shrink-0">
                  <Link
                    href={`/onboarding/${step.id}`}
                    className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
                  >
                    {done ? (
                      <CheckCircle2 className="size-4 shrink-0 text-primary" />
                    ) : (
                      <Circle className="size-4 shrink-0" />
                    )}
                    <span className={cn("whitespace-nowrap", done && "text-foreground")}>
                      {step.id}. {step.shortTitle}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ol>
        </nav>

        <main className="min-w-0 flex-1 rounded-2xl border bg-background p-6 shadow-sm md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}

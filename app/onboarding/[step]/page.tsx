import { requireCurrentProfile } from "@/lib/auth/session";

// Placeholder — el wizard de 12 pasos se construye en la tarea
// "Onboarding wizard (12 pasos) + checklist de activación".
export default async function OnboardingStepPage({
  params,
}: {
  params: Promise<{ step: string }>;
}) {
  await requireCurrentProfile();
  const { step } = await params;

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl border bg-background p-8 text-center shadow-sm">
        <p className="text-sm text-muted-foreground">Paso {step} de 12</p>
        <h1 className="mt-2 text-xl font-semibold">Configura tu consultorio</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          El asistente de configuración paso a paso está en construcción.
        </p>
      </div>
    </div>
  );
}

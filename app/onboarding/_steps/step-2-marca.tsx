"use client";

import { useActionState, useState } from "react";
import { updateBranding, type OnboardingActionState } from "../actions";
import { StepShell } from "../_components/step-shell";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { VISUAL_THEMES, VISUAL_THEME_LABELS, type VisualTheme } from "@/components/themes/theme-provider";
import { cn } from "@/lib/utils";
import type { Database } from "@/lib/supabase/types";

const initialState: OnboardingActionState = {};

export function Step2Marca({
  branding,
}: {
  branding: Database["public"]["Tables"]["clinic_branding"]["Row"] | null;
}) {
  const [state, formAction, isPending] = useActionState(updateBranding, initialState);
  const [theme, setTheme] = useState<VisualTheme>((branding?.visual_theme as VisualTheme) ?? "clinico_moderno");
  const [preview, setPreview] = useState<string | null>(branding?.logo_url ?? null);

  return (
    <form action={formAction}>
      <StepShell
        title="Elige la marca visual de tu consultorio"
        description="Tu logo y colores se usarán en tu página pública, recordatorios y portal de pacientes."
        hideNext
      >
        <div className="space-y-2">
          <Label htmlFor="logo">Logo</Label>
          <div className="flex items-center gap-4">
            {preview && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={preview} alt="Logo" className="size-16 rounded-xl border object-cover" />
            )}
            <Input
              id="logo"
              name="logo"
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) setPreview(URL.createObjectURL(file));
              }}
            />
          </div>
        </div>

        <div className="space-y-3">
          <Label>Tema visual</Label>
          <div className="grid gap-3 sm:grid-cols-3">
            {VISUAL_THEMES.map((t) => (
              <button
                type="button"
                key={t}
                onClick={() => setTheme(t)}
                data-theme={t}
                className={cn(
                  "rounded-xl border-2 p-3 text-left transition-colors",
                  theme === t ? "border-primary" : "border-border",
                )}
              >
                <div className="flex gap-1.5">
                  <span className="size-5 rounded-full" style={{ background: "var(--primary)" }} />
                  <span className="size-5 rounded-full" style={{ background: "var(--accent)" }} />
                  <span className="size-5 rounded-full" style={{ background: "var(--secondary)" }} />
                </div>
                <p className="mt-2 text-sm font-medium">{VISUAL_THEME_LABELS[t]}</p>
              </button>
            ))}
          </div>
          <input type="hidden" name="visual_theme" value={theme} />
        </div>

        {theme === "personalizado" && (
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="primary_color">Color principal</Label>
              <Input id="primary_color" name="primary_color" type="color" defaultValue={branding?.primary_color ?? "#0F4C4C"} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="secondary_color">Color secundario</Label>
              <Input id="secondary_color" name="secondary_color" type="color" defaultValue={branding?.secondary_color ?? "#F5F1E8"} />
            </div>
          </div>
        )}
        {theme !== "personalizado" && (
          <>
            <input type="hidden" name="primary_color" value={branding?.primary_color ?? "#0F4C4C"} />
            <input type="hidden" name="secondary_color" value={branding?.secondary_color ?? "#F5F1E8"} />
          </>
        )}

        {state?.error && <p className="text-sm text-destructive">{state.error}</p>}

        <div className="flex justify-end border-t pt-6">
          <Button type="submit" disabled={isPending}>
            {isPending ? "Guardando..." : "Continuar"}
          </Button>
        </div>
      </StepShell>
    </form>
  );
}

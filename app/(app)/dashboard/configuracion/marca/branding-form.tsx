"use client";

import { useActionState, useState } from "react";
import { updateClinicBranding, type BrandingActionState } from "./actions";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  VISUAL_THEMES,
  VISUAL_THEME_LABELS,
  FONT_STYLES,
  FONT_STYLE_LABELS,
  type VisualTheme,
  type FontStyle,
} from "@/components/themes/theme-provider";
import { cn } from "@/lib/utils";
import type { Database } from "@/lib/supabase/types";

const initialState: BrandingActionState = {};

export function BrandingForm({
  branding,
  commercialName,
}: {
  branding: Database["public"]["Tables"]["clinic_branding"]["Row"] | null;
  commercialName: string;
}) {
  const [state, formAction, isPending] = useActionState(updateClinicBranding, initialState);
  const [theme, setTheme] = useState<VisualTheme>((branding?.visual_theme as VisualTheme) ?? "clinico_moderno");
  const [fontStyle, setFontStyle] = useState<FontStyle>((branding?.font_style as FontStyle) ?? "default");
  const [logoPreview, setLogoPreview] = useState<string | null>(branding?.logo_url ?? null);
  const [coverPreview, setCoverPreview] = useState<string | null>(branding?.cover_image_url ?? null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(branding?.professional_photo_url ?? null);

  return (
    <form action={formAction} className="max-w-2xl space-y-6">
      <div className="space-y-2">
        <Label htmlFor="commercial_name">Nombre comercial</Label>
        <Input id="commercial_name" name="commercial_name" defaultValue={commercialName} required />
      </div>

      <div className="space-y-2">
        <Label htmlFor="logo">Logo</Label>
        <div className="flex items-center gap-4">
          {logoPreview && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoPreview} alt="Logo" className="size-16 rounded-xl border object-cover" />
          )}
          <Input
            id="logo"
            name="logo"
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) setLogoPreview(URL.createObjectURL(file));
            }}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="cover_image">Imagen de portada</Label>
        <p className="text-xs text-muted-foreground">Se muestra como banner en tu página pública.</p>
        <div className="flex items-center gap-4">
          {coverPreview && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={coverPreview} alt="Portada" className="h-16 w-28 rounded-xl border object-cover" />
          )}
          <Input
            id="cover_image"
            name="cover_image"
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) setCoverPreview(URL.createObjectURL(file));
            }}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="professional_photo">Foto profesional destacada</Label>
        <p className="text-xs text-muted-foreground">
          Retrato que aparece junto a tu nombre en el encabezado de tu página pública.
        </p>
        <div className="flex items-center gap-4">
          {photoPreview && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photoPreview} alt="Foto profesional" className="size-16 rounded-full border object-cover" />
          )}
          <Input
            id="professional_photo"
            name="professional_photo"
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) setPhotoPreview(URL.createObjectURL(file));
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

      <div className="space-y-3">
        <Label>Estilo tipográfico</Label>
        <div className="grid gap-3 sm:grid-cols-3">
          {FONT_STYLES.map((f) => (
            <button
              type="button"
              key={f}
              onClick={() => setFontStyle(f)}
              className={cn(
                "rounded-xl border-2 p-3 text-left transition-colors",
                fontStyle === f ? "border-primary" : "border-border",
                f === "serif" && "font-serif",
                f === "mono" && "font-mono",
              )}
            >
              <p className="text-sm font-medium">{FONT_STYLE_LABELS[f]}</p>
            </button>
          ))}
        </div>
        <input type="hidden" name="font_style" value={fontStyle} />
      </div>

      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
      {state?.success && <p className="text-sm text-primary">Cambios guardados.</p>}

      <Button type="submit" disabled={isPending}>
        {isPending ? "Guardando..." : "Guardar cambios"}
      </Button>
    </form>
  );
}

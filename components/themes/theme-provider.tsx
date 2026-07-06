import type { CSSProperties } from "react";
import { contrastTextColor } from "@/lib/utils/contrast-color";

export const VISUAL_THEMES = [
  "clinico_moderno",
  "bienestar_premium",
  "integrativo",
  "terapeutico_emocional",
  "odontologico_premium",
  "personalizado",
] as const;

export type VisualTheme = (typeof VISUAL_THEMES)[number];

export const VISUAL_THEME_LABELS: Record<VisualTheme, string> = {
  clinico_moderno: "Clínico Moderno",
  bienestar_premium: "Bienestar Premium",
  integrativo: "Integrativo",
  terapeutico_emocional: "Terapéutico Emocional",
  odontologico_premium: "Odontológico Premium",
  personalizado: "Personalizado",
};

/**
 * Coloca data-theme en un contenedor para activar las variables CSS del tema
 * (ver app/globals.css). Para "personalizado" inyecta primary/secondary de
 * la clínica directamente como variables inline, sin bloque fijo en CSS.
 */
export function ThemeProvider({
  theme,
  primaryColor,
  secondaryColor,
  className,
  children,
}: {
  theme: VisualTheme;
  primaryColor?: string | null;
  secondaryColor?: string | null;
  className?: string;
  children: React.ReactNode;
}) {
  const customStyle: CSSProperties & Record<string, string | undefined> = {};

  if (theme === "personalizado") {
    if (primaryColor) {
      customStyle["--primary"] = primaryColor;
      customStyle["--ring"] = primaryColor;
      customStyle["--primary-foreground"] = contrastTextColor(primaryColor);
    }
    if (secondaryColor) {
      customStyle["--secondary"] = secondaryColor;
      customStyle["--secondary-foreground"] = contrastTextColor(secondaryColor);
    }
  }

  return (
    <div data-theme={theme} style={customStyle} className={className}>
      {children}
    </div>
  );
}

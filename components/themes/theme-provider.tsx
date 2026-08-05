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

export const FONT_STYLES = ["default", "serif", "mono"] as const;
export type FontStyle = (typeof FONT_STYLES)[number];

export const FONT_STYLE_LABELS: Record<FontStyle, string> = {
  default: "Estándar (Geist)",
  serif: "Elegante (serif)",
  mono: "Técnico (monoespaciada)",
};

const FONT_STYLE_CLASSNAMES: Record<FontStyle, string> = {
  default: "",
  serif: "font-serif",
  mono: "font-mono",
};

function isFontStyle(value: string | null | undefined): value is FontStyle {
  return (FONT_STYLES as readonly string[]).includes(value ?? "");
}

/**
 * Coloca data-theme en un contenedor para activar las variables CSS del tema
 * (ver app/globals.css). Para "personalizado" inyecta primary/secondary de
 * la clínica directamente como variables inline, sin bloque fijo en CSS.
 */
export function ThemeProvider({
  theme,
  primaryColor,
  secondaryColor,
  fontStyle,
  className,
  children,
}: {
  theme: VisualTheme;
  primaryColor?: string | null;
  secondaryColor?: string | null;
  fontStyle?: string | null;
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

  const fontClassName = isFontStyle(fontStyle) ? FONT_STYLE_CLASSNAMES[fontStyle] : "";

  return (
    <div data-theme={theme} style={customStyle} className={[className, fontClassName].filter(Boolean).join(" ")}>
      {children}
    </div>
  );
}

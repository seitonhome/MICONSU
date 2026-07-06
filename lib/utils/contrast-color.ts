/** Devuelve negro o blanco según el contraste legible sobre un color hex dado. */
export function contrastTextColor(hex: string): "#111111" | "#ffffff" {
  const value = hex.replace("#", "");
  if (value.length !== 6) return "#111111";

  const r = parseInt(value.slice(0, 2), 16);
  const g = parseInt(value.slice(2, 4), 16);
  const b = parseInt(value.slice(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  return luminance > 0.6 ? "#111111" : "#ffffff";
}

/**
 * Construye un link wa.me a partir de un número guardado en cualquier
 * formato (con espacios, guiones, +, con o sin indicativo). Colombia es el
 * único mercado del producto (ver AGENTS.md), así que un número local de 10
 * dígitos que empieza en 3 (celular) se asume sin indicativo y se le
 * antepone 57 — wa.me exige el número completo con código de país.
 */
export function buildWhatsAppLink(rawPhone: string | null | undefined, message?: string): string | null {
  if (!rawPhone) return null;
  let digits = rawPhone.replace(/\D/g, "");
  if (!digits) return null;

  if (digits.length === 10 && digits.startsWith("3")) {
    digits = `57${digits}`;
  }

  const params = message ? `?text=${encodeURIComponent(message)}` : "";
  return `https://wa.me/${digits}${params}`;
}

import { buildWhatsAppLink } from "@/lib/utils/whatsapp";

/**
 * Verde de marca de WhatsApp fijo (no el --primary del tema del consultorio)
 * a propósito: el reconocimiento visual del botón depende de ese color
 * específico — un botón "correcto para el branding" pero de otro color deja
 * de leerse como "acá se abre WhatsApp" a primera vista.
 */
export function WhatsAppFloatingButton({ phone, message }: { phone: string | null | undefined; message?: string }) {
  const href = buildWhatsAppLink(phone, message);
  if (!href) return null;

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      aria-label="Contactar por WhatsApp"
      className="fixed right-5 bottom-5 z-50 flex size-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition-transform hover:scale-105 active:scale-95"
    >
      <svg viewBox="0 0 32 32" width="30" height="30" fill="currentColor" aria-hidden="true">
        <path d="M16.004 3.2c-7.06 0-12.8 5.74-12.8 12.8 0 2.26.6 4.43 1.72 6.35L3.2 28.8l6.62-1.68a12.74 12.74 0 0 0 6.18 1.58h.005c7.06 0 12.8-5.74 12.8-12.8s-5.74-12.8-12.8-12.8Zm0 23.36a10.5 10.5 0 0 1-5.36-1.47l-.385-.23-3.93 1 1.05-3.83-.25-.394a10.55 10.55 0 0 1-1.63-5.62c0-5.83 4.75-10.56 10.6-10.56 2.83 0 5.49 1.1 7.49 3.1a10.51 10.51 0 0 1 3.1 7.47c0 5.83-4.75 10.55-10.68 10.55Zm5.8-7.9c-.315-.16-1.87-.92-2.16-1.03-.29-.105-.5-.16-.71.16-.21.315-.815 1.03-1 1.24-.185.21-.37.235-.685.08-.315-.16-1.33-.49-2.53-1.56-.935-.835-1.565-1.865-1.75-2.18-.185-.315-.02-.485.14-.64.14-.14.315-.37.47-.555.16-.185.21-.315.315-.525.105-.21.055-.395-.025-.555-.08-.16-.71-1.71-.975-2.34-.255-.615-.52-.53-.71-.54h-.605c-.21 0-.55.08-.84.395-.29.315-1.1 1.075-1.1 2.62 0 1.545 1.125 3.04 1.28 3.25.16.21 2.215 3.38 5.365 4.74.75.325 1.335.52 1.79.665.75.24 1.435.205 1.975.125.6-.09 1.87-.765 2.135-1.505.265-.74.265-1.375.185-1.505-.075-.13-.29-.21-.605-.365Z" />
      </svg>
    </a>
  );
}

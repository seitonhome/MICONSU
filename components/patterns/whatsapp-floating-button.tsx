import { buildWhatsAppLink } from "@/lib/utils/whatsapp";
import { WhatsAppIcon } from "./whatsapp-icon";

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
      <WhatsAppIcon className="size-[30px]" />
    </a>
  );
}

export type Tip = { title: string; body: string };
export type TipCategory = { key: string; label: string; tips: Tip[] };

export const TIP_CATEGORIES: TipCategory[] = [
  {
    key: "primeros-pasos",
    label: "Primeros pasos",
    tips: [
      {
        title: "No necesitas terminarlo todo el primer día",
        body: "Activa lo esencial del asistente de configuración (logo, un servicio, un horario, un método de pago) y publica. Puedes seguir ajustando servicios, horarios y textos legales sobre la marcha.",
      },
      {
        title: "Usa el checklist de activación de tu panel de inicio",
        body: "Aparece hasta que completas las tareas clave: logo, tema visual, primer servicio, horario, método de pago, política de datos, publicar tu página, primera cita y compartir tu link de reserva.",
      },
      {
        title: "Prueba tu propio flujo de reserva",
        body: "Antes de compartir tu link con pacientes reales, reserva una cita de prueba en tu propia página pública. Así detectas textos confusos o pasos que quieras ajustar.",
      },
    ],
  },
  {
    key: "agenda",
    label: "Agenda",
    tips: [
      {
        title: "Define un colchón entre citas",
        body: "En Configuración → Horarios puedes dejar minutos de margen entre una cita y otra, para no quedar sin tiempo de preparación o de escribir tus notas.",
      },
      {
        title: "Activa la lista de espera",
        body: "Cuando alguien cancela, en vez de perder el espacio puedes ofrecerlo directamente a quien esté en la lista de espera para ese servicio y esas fechas.",
      },
      {
        title: "Bloquea franjas puntuales, no solo tu horario fijo",
        body: "Vacaciones, una emergencia o un día ocupado no requieren cambiar tu horario general — puedes bloquear solo esa franja específica.",
      },
    ],
  },
  {
    key: "pacientes",
    label: "Pacientes",
    tips: [
      {
        title: "Los pacientes se registran solos al reservar",
        body: "No necesitas crear manualmente cada ficha — cuando alguien reserva desde tu página pública, su ficha de paciente aparece automáticamente en Pacientes.",
      },
      {
        title: "Separa lo administrativo de lo clínico",
        body: "La ficha del paciente (datos, pagos, documentos) es visible para tu equipo administrativo. Las notas clínicas viven en un módulo aparte, con acceso restringido y auditado.",
      },
      {
        title: "El portal del paciente reduce mensajes de WhatsApp",
        body: "Tus pacientes pueden entrar a su portal con solo su correo (sin contraseña) para ver su próxima cita, pagos y recursos — menos preguntas repetidas por chat.",
      },
    ],
  },
  {
    key: "pagos",
    label: "Pagos",
    tips: [
      {
        title: "Pide anticipo para bajar las inasistencias",
        body: "Los servicios con anticipo obligatorio tienden a tener menos \"no-shows\" que los que no piden ningún compromiso de pago.",
      },
      {
        title: "No dependas de una sola pasarela",
        body: "Puedes activar Wompi, Mercado Pago, ePayco, transferencia manual y pago presencial al mismo tiempo — tus pacientes eligen cómo pagarte.",
      },
      {
        title: "Revisa Conciliación regularmente",
        body: "Los pagos manuales (transferencia, comprobante subido) quedan pendientes de tu confirmación en Pagos → Conciliación hasta que los revises.",
      },
    ],
  },
  {
    key: "pagina-publica",
    label: "Página pública",
    tips: [
      {
        title: "Elige un tema visual según tu tipo de práctica",
        body: "Los 5 temas están pensados para distintos perfiles (clínico, bienestar, integrativo, emocional, odontológico) — o define tus propios colores en \"Personalizado\".",
      },
      {
        title: "Decide si muestras precios públicamente",
        body: "Cada servicio tiene su propio interruptor de precio visible — puedes mostrar unos y dejar otros solo \"a consultar\".",
      },
    ],
  },
  {
    key: "legal",
    label: "Consentimientos y legal",
    tips: [
      {
        title: "Cada edición de un texto legal queda versionada",
        body: "Si cambias tu política de datos o un consentimiento, el sistema guarda la versión anterior — siempre puedes comprobar qué texto exacto aceptó cada paciente y cuándo.",
      },
      {
        title: "Revisa el checklist legal Colombia",
        body: "En docs/LEGAL_CHECKLIST_COLOMBIA.md tienes una guía de qué normas podrían aplicarte según tu tipo de práctica — el sistema da las herramientas, pero no reemplaza tu propio asesor legal.",
      },
    ],
  },
  {
    key: "crecimiento",
    label: "Paquetes, procesos y crecimiento",
    tips: [
      {
        title: "Vende procesos completos, no solo citas sueltas",
        body: "Si acompañas tratamientos de varias sesiones, un paquete lleva automáticamente el conteo de sesiones usadas y restantes, sin que tengas que llevar la cuenta a mano.",
      },
      {
        title: "Revisa Oportunidades una vez por semana",
        body: "Te muestra pacientes sin próxima cita, pagos pendientes y horarios libres — es un resumen accionable de tus propios datos, no marketing automatizado.",
      },
    ],
  },
];

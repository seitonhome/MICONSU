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
        title: "Publicar tu página es un paso aparte, no automático",
        body: "Terminar el asistente de configuración no publica tu página pública por sí solo. Ve a Configuración → Marca y tema visual y confirma que diga \"Tu página pública está activa\". Si dice que aún no está publicada, dale clic a \"Publicar mi página\" — mientras no lo hagas, nadie puede ver tu página ni reservar, aunque el link exista.",
      },
      {
        title: "Prueba tu propio flujo de reserva",
        body: "Antes de compartir tu link con pacientes reales, reserva una cita de prueba en tu propia página pública (Configuración → Marca → \"Ver mi página\"). Así detectas textos confusos, servicios mal configurados o pasos que quieras ajustar.",
      },
      {
        title: "Entiende los roles de tu equipo",
        body: "clinic_owner (dueño, ve y edita todo), assistant/receptionist (agenda, pacientes, pagos, sin datos clínicos sensibles) y professional (su propia agenda y sus procesos clínicos). Los procesos terapéuticos y notas clínicas solo los ve el dueño y el profesional tratante, nunca recepción.",
      },
      {
        title: "El menú lateral está agrupado por objetivo",
        body: "General (agenda, pacientes, profesionales, lista de espera) para el día a día; Servicios y pagos para tu catálogo y cobros; Crecimiento para todo lo que no es urgente pero te ayuda a vender más (paquetes, talleres, recursos, seguimientos, reseñas, oportunidades, reportes); Cuenta para configuración, ayuda y soporte.",
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
        body: "Cuando alguien cancela, en vez de perder el espacio puedes ofrecerlo directamente a quien esté en la lista de espera para ese servicio y esas fechas. Se gestiona desde Agenda → Lista de espera.",
      },
      {
        title: "Bloquea franjas puntuales, no solo tu horario fijo",
        body: "Vacaciones, una emergencia o un día ocupado no requieren cambiar tu horario general — puedes bloquear solo esa franja específica desde Configuración → Horarios → Bloqueos.",
      },
      {
        title: "Filtra la agenda por paciente para ver su historial completo",
        body: "El filtro \"Todos los pacientes\" de Agenda, al elegir uno específico, deja de mostrarte solo el día actual y te muestra todas sus citas (pasadas y futuras) ordenadas por fecha — no hace falta ir día por día para saber cuándo fue su última cita.",
      },
      {
        title: "\"Nueva cita\" desde el dashboard sí envía confirmación",
        body: "Cuando agendas manualmente desde Agenda → Nueva cita (no desde la reserva pública), el paciente recibe el mismo correo de confirmación que si hubiera reservado él mismo, siempre que tenga un correo válido registrado.",
      },
      {
        title: "Los estados de una cita cuentan una historia",
        body: "Confirmada → Registrada (check-in) → En curso → Completada es el camino normal. Cancelada y No asistió quedan aparte para tus reportes de inasistencias — márcalas correctamente, porque alimentan directamente el Panel de oportunidades y los Reportes.",
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
        title: "Usa el buscador para encontrar por nombre, documento, teléfono o correo",
        body: "El campo de búsqueda en Pacientes filtra por cualquiera de esos cuatro datos a la vez — no hace falta que sepas el nombre exacto si tienes el número de documento o el teléfono.",
      },
      {
        title: "Separa lo administrativo de lo clínico",
        body: "La ficha del paciente (datos, pagos, documentos) es visible para tu equipo administrativo. Las notas clínicas y procesos terapéuticos viven en un módulo aparte (Historia clínica), con acceso restringido solo a ti y al profesional tratante.",
      },
      {
        title: "Marca cada documento como clínico o administrativo al subirlo",
        body: "Al subir un documento a la ficha de un paciente, hay un checkbox \"Documento clínico\" — si lo marcas, solo lo ve tu equipo; si lo dejas sin marcar, el paciente también lo puede ver en su portal. Revisa este checkbox conscientemente cada vez, el sistema no lo adivina por ti.",
      },
      {
        title: "Los documentos tienen un límite de tamaño",
        body: "Los documentos de pacientes admiten hasta 15 MB por archivo. Si necesitas subir algo más pesado (un video, por ejemplo), considera subirlo como Recurso digital (hasta 25 MB) en vez de como documento de ficha.",
      },
      {
        title: "Borrar un paciente es reversible en la base de datos, pero no en la interfaz",
        body: "Al eliminar un paciente, sus datos no se muestran más pero no se destruyen (queda \"archivado\"). Si necesitas recuperar uno por error, escríbenos por Soporte.",
      },
    ],
  },
  {
    key: "profesionales",
    label: "Profesionales",
    tips: [
      {
        title: "Agrega profesionales en cualquier momento, no solo durante el registro",
        body: "Ve a Profesionales en el menú General para crear, editar o desactivar profesionales — no es algo que solo se configure una vez al inicio.",
      },
      {
        title: "Cada profesional aparece automáticamente en tu página pública",
        body: "Los profesionales activos se listan en \"Nuestro equipo\" en tu página pública (/c/tu-slug) y cada uno tiene su propia página individual (/p/su-slug) con sus servicios y disponibilidad.",
      },
      {
        title: "Desactivar en vez de eliminar",
        body: "Si un profesional deja de trabajar contigo, desactívalo en vez de borrarlo — así conservas el historial de sus citas y procesos pasados sin que siga apareciendo disponible para nuevas reservas.",
      },
      {
        title: "El tipo de profesional determina las etiquetas que ve tu consultorio",
        body: "El tipo de práctica principal que elegiste al registrarte (médico, odontólogo, psicólogo, bienestar, etc.) ajusta el lenguaje y las opciones sugeridas en el resto de la app, incluyendo el profesional por defecto que se sugiere al agregar uno nuevo.",
      },
    ],
  },
  {
    key: "servicios",
    label: "Servicios",
    tips: [
      {
        title: "La clasificación del servicio no es solo informativa",
        body: "Elegir correctamente si un servicio es de salud habilitado, terapia alternativa, bienestar, educativo o no clínico determina qué avisos legales se sugieren automáticamente para ese servicio (por ejemplo, el aviso de \"no reemplaza valoración médica\" para terapias alternativas).",
      },
      {
        title: "Puedes ocultar el precio y dejarlo \"a consultar\"",
        body: "Cada servicio tiene su propio interruptor de precio visible, independiente del resto — puedes mostrar precios en unos servicios y dejar otros sin precio público.",
      },
      {
        title: "El anticipo obligatorio reduce inasistencias",
        body: "Puedes exigir un anticipo fijo para un servicio específico. Si el paciente no lo paga, la cita no queda confirmada — esto filtra reservas poco serias antes de que ocupen tu agenda.",
      },
      {
        title: "Organiza servicios en categorías si tienes muchos",
        body: "Las categorías (con orden configurable) agrupan servicios relacionados en tu página pública, para que no se vea como una lista plana e interminable.",
      },
      {
        title: "La modalidad afecta cómo se muestra la reserva",
        body: "Un servicio \"Virtual\" oculta la selección de sede al reservar y en su lugar puede mostrar el link de la videollamada; uno \"Presencial y virtual\" deja al paciente elegir.",
      },
    ],
  },
  {
    key: "portal-paciente",
    label: "Portal del paciente",
    tips: [
      {
        title: "El paciente entra con su correo, sin contraseña",
        body: "En /portal/login, el paciente pone el correo que usó para reservar y recibe un link mágico de un solo uso — no necesita crear ni recordar ninguna contraseña.",
      },
      {
        title: "El acceso ya está enlazado desde la confirmación de cita",
        body: "No tienes que explicarle al paciente cómo llegar al portal: el correo de confirmación/recordatorio de su cita ya incluye un link directo (\"Ver tu historial, pagos y documentos en tu portal\").",
      },
      {
        title: "Qué ve el paciente en su portal",
        body: "Sus citas (pasadas y futuras), estado de sus pagos, recursos que le hayas asignado, y los documentos que hayas subido a su ficha sin marcar como \"clínico\". Nunca ve notas clínicas ni procesos terapéuticos.",
      },
      {
        title: "Si tiene citas en más de un consultorio con el mismo correo",
        body: "El portal le muestra un selector para elegir cuál consultorio quiere ver — un mismo correo puede estar vinculado a varias clínicas distintas que usen Mi Consultorio Pro.",
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
        body: "Puedes activar Wompi, Mercado Pago, ePayco, link de pago externo, transferencia manual y pago presencial al mismo tiempo — tus pacientes eligen cómo pagarte. Cada consultorio configura sus propias credenciales de pasarela, cifradas, desde Pagos.",
      },
      {
        title: "Revisa Conciliación regularmente",
        body: "Los pagos manuales (transferencia, comprobante subido) quedan pendientes de tu confirmación en Pagos → Conciliación hasta que los revises — no se aprueban solos.",
      },
      {
        title: "PayU, Bold y PlaceToPay aún no están disponibles",
        body: "Aparecen como \"próximamente\" porque su integración real todavía no existe — no actives ninguna de estas tres esperando que funcione. Si las necesitas con urgencia, escríbenos por Soporte para priorizarlo.",
      },
      {
        title: "El estado de pago es independiente del estado de la cita",
        body: "Una cita puede estar \"Confirmada\" con el pago \"Pendiente de confirmación\" — revisa ambos estados por separado, sobre todo si trabajas con pagos manuales.",
      },
    ],
  },
  {
    key: "pagina-publica",
    label: "Página pública",
    tips: [
      {
        title: "Tu página no es visible hasta que la publicas",
        body: "En Configuración → Marca hay un botón \"Publicar mi página\". Mientras no le des clic, /c/tu-slug muestra \"Página no encontrada\" para cualquiera que la visite, incluidos tus propios pacientes.",
      },
      {
        title: "Elige un tema visual según tu tipo de práctica",
        body: "Los 5 temas están pensados para distintos perfiles (clínico, bienestar, integrativo, emocional, odontológico) — o define tus propios colores en \"Personalizado\".",
      },
      {
        title: "El logo se usa en más lugares de los que crees",
        body: "Además de tu página pública, el logo ahora también aparece en el sidebar de tu dashboard y en el header móvil, junto al nombre de tu consultorio.",
      },
      {
        title: "Puedes despublicar temporalmente",
        body: "Si necesitas pausar reservas nuevas (vacaciones largas, sobrecarga de agenda), \"Despublicar\" desde el mismo lugar oculta tu página sin borrar nada — la vuelves a activar cuando quieras.",
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
        title: "Son los documentos que el paciente acepta antes de reservar",
        body: "Política de datos, autorización de datos sensibles, consentimiento informado, política de cancelación, etc. — el paciente los acepta en el paso final de la reserva pública, antes de confirmar la cita.",
      },
      {
        title: "Cada edición de un texto legal queda versionada",
        body: "Si cambias tu política de datos o un consentimiento, el sistema guarda la versión anterior — siempre puedes comprobar qué texto exacto aceptó cada paciente y cuándo, desde el registro de esa cita.",
      },
      {
        title: "El sistema sugiere qué documentos activar según tus servicios",
        body: "Si clasificas un servicio como \"terapia alternativa\", \"bienestar\" o \"salud habilitado\", se sugiere automáticamente el aviso legal correspondiente — pero la decisión final de activarlo o no es tuya.",
      },
      {
        title: "Puedes desactivar un documento sin borrarlo",
        body: "Si un documento ya no aplica, desactívalo en vez de eliminarlo — conserva el historial de quién lo aceptó mientras estuvo activo.",
      },
      {
        title: "Revisa el checklist legal Colombia",
        body: "En LEGAL_CHECKLIST_COLOMBIA.md tienes una guía de qué normas podrían aplicarte según tu tipo de práctica — el sistema da las herramientas, pero no reemplaza tu propio asesor legal.",
      },
    ],
  },
  {
    key: "crecimiento",
    label: "Paquetes y procesos",
    tips: [
      {
        title: "Paquetes: vende procesos completos, no solo citas sueltas",
        body: "Si acompañas tratamientos de varias sesiones, un paquete lleva automáticamente el conteo de sesiones usadas y restantes, sin que tengas que llevar la cuenta a mano. \"Registrar sesión\" descuenta una del saldo cada vez.",
      },
      {
        title: "Ya puedes editar un paquete después de creado",
        body: "Nombre, número de sesiones, precio y vigencia se pueden ajustar desde el ícono de lápiz en cada paquete — ya no hace falta cancelar y crear uno nuevo si te equivocaste al capturarlo.",
      },
      {
        title: "Los paquetes y procesos no se sincronizan solos con Agenda",
        body: "Registrar una sesión de un paquete o anotar la \"próxima sesión\" de un proceso terapéutico no crea automáticamente una cita en Agenda, y viceversa — son dos registros independientes que debes mantener coordinados tú mismo por ahora.",
      },
      {
        title: "Procesos terapéuticos: acceso restringido de verdad",
        body: "Solo tú (dueño) y el profesional tratante ven los procesos y sus notas de evolución — ni asistentes ni recepción tienen acceso, a diferencia de casi todo lo demás en la app.",
      },
    ],
  },
  {
    key: "grupales",
    label: "Talleres y sesiones grupales",
    tips: [
      {
        title: "Es un roster de inscritos, no un carrito de compra",
        body: "Hoy la inscripción a un taller la hace tu equipo desde el dashboard (no hay una página pública donde el paciente se inscriba y pague solo). El sistema sí controla el cupo máximo y no deja pasarse.",
      },
      {
        title: "Marca la asistencia y el pago por separado",
        body: "Cada inscrito tiene su propio estado de pago (pendiente/pagado/exonerado) y su marca de asistencia, independientes entre sí — útil si alguien pagó pero no pudo asistir, o viceversa.",
      },
      {
        title: "No puedes inscribir más allá del cupo",
        body: "Si el taller está lleno, el botón de inscribir desaparece automáticamente — no hay forma de sobre-inscribir por accidente.",
      },
    ],
  },
  {
    key: "recursos",
    label: "Recursos digitales",
    tips: [
      {
        title: "Sube una vez, asigna a varios pacientes",
        body: "Un mismo PDF, audio, video o guía puede asignarse a tantos pacientes como quieras — no necesitas volver a subirlo cada vez.",
      },
      {
        title: "El paciente lo ve directo en su portal",
        body: "En cuanto asignas un recurso a un paciente, aparece en la sección de recursos de su portal — no hace falta enviárselo por WhatsApp aparte.",
      },
      {
        title: "Hay un límite de 25 MB por archivo",
        body: "Pensado para PDFs, audios y videos cortos. Si tienes contenido más pesado, considera subirlo a YouTube/Vimeo como no listado y compartir el link en la descripción del recurso.",
      },
      {
        title: "\"Quitar de la biblioteca\" no borra el archivo",
        body: "Desactivar un recurso lo oculta para asignaciones nuevas, pero los pacientes que ya lo tenían asignado conservan el acceso — es intencional, para no romper algo que ya compartiste.",
      },
    ],
  },
  {
    key: "seguimientos",
    label: "Seguimiento postconsulta",
    tips: [
      {
        title: "\"Enviar ahora\" manda un correo real",
        body: "Cuando programas un seguimiento (agradecimiento, encuesta, solicitud de reseña, renovación de paquete) y le das clic al ícono de enviar, el sistema le manda un correo de verdad al paciente — no necesitas escribirlo tú aparte por WhatsApp.",
      },
      {
        title: "\"Solicitud de reseña\" incluye el link para que la deje",
        body: "Ese tipo de seguimiento manda automáticamente el link a tu página de reseñas públicas, así que el paciente puede calificarte con un clic desde el correo.",
      },
      {
        title: "Si el paciente no tiene correo registrado, no se puede enviar",
        body: "El botón de enviar te avisará si falta el correo — en ese caso, agrégalo primero desde la ficha del paciente.",
      },
      {
        title: "Usa \"Personalizado\" para mensajes que no encajan en las otras categorías",
        body: "El campo de mensaje se envía tal cual lo escribas, útil para cualquier seguimiento que no sea agradecimiento, encuesta, reseña o renovación.",
      },
    ],
  },
  {
    key: "resenas",
    label: "Reseñas",
    tips: [
      {
        title: "El paciente ya puede dejar su propia reseña",
        body: "Tu página pública tiene un link \"¿Ya nos visitaste? Déjanos tu reseña\" que lleva a un formulario simple (estrellas + comentario), sin necesidad de que inicie sesión. También puedes enviarle ese link directo por WhatsApp.",
      },
      {
        title: "Nacen privadas: tú decides qué se publica",
        body: "Ninguna reseña (ni la que deja el paciente, ni la que registras tú a mano) aparece en tu página pública automáticamente. Debes aprobarla o destacarla desde Reseñas primero.",
      },
      {
        title: "También puedes registrar reseñas recibidas por otros canales",
        body: "Si alguien te dejó una buena reseña por WhatsApp, Google o de palabra, puedes transcribirla manualmente desde \"Registrar reseña\" — queda igual de privada hasta que la apruebes.",
      },
      {
        title: "\"Destacar\" la resalta sobre las simplemente \"aprobadas\"",
        body: "Usa Destacar para las mejores reseñas que quieras que se noten más en tu página pública.",
      },
    ],
  },
  {
    key: "oportunidades-reportes",
    label: "Oportunidades y reportes",
    tips: [
      {
        title: "Revisa Oportunidades una vez por semana",
        body: "Te muestra pacientes sin próxima cita, espacios cancelados recuperables, pagos pendientes, horas libres esta semana, servicios con más demanda, pacientes frecuentes y pacientes inactivos — todo calculado en tiempo real sobre tus propios datos, sin que tengas que armarlo tú.",
      },
      {
        title: "\"Pacientes inactivos\" es tu lista de reconquista",
        body: "Son quienes no han vuelto en más de 60 días — un buen candidato para enviarles un seguimiento personalizado en vez de dejarlos ir.",
      },
      {
        title: "Reportes cubre los últimos 6 meses",
        body: "Citas, ingresos, pacientes nuevos y servicios más reservados, mes a mes, con gráficas y exportación a CSV para llevarlo a Excel o compartirlo con tu contador.",
      },
      {
        title: "\"Ingresos por mes\" solo cuenta pagos aprobados",
        body: "No incluye pagos pendientes de confirmar — si algo no cuadra, revisa primero Pagos → Conciliación por si tienes pagos manuales sin aprobar todavía.",
      },
    ],
  },
  {
    key: "soporte-continuidad",
    label: "Soporte y continuidad",
    tips: [
      {
        title: "Tus tickets sí llegan a un equipo humano",
        body: "Los tickets creados desde Soporte se envían al equipo de Mi Consultorio Pro y también quedan registrados aquí, con su propio historial de comentarios — puedes seguir la conversación desde el mismo lugar donde lo creaste.",
      },
      {
        title: "El tiempo de respuesta depende de tu plan",
        body: "Tu Plan Continuidad Clínica incluye un SLA de soporte — revisa el detalle en la sección de Soporte de tu panel para saber qué tiempo de respuesta esperar.",
      },
      {
        title: "Antes de crear un ticket, revisa esta sección de Ayuda",
        body: "Muchas de las dudas más comunes (por qué no veo tal cosa, cómo se configura tal otra) ya están respondidas aquí abajo, en \"Preguntas frecuentes\" — te ahorra la espera de una respuesta.",
      },
      {
        title: "El respaldo de tus datos depende hoy del plan de base de datos, no de un proceso propio",
        body: "Si manejas información especialmente sensible (historia clínica, pagos), exportar tus datos periódicamente desde Reportes es una capa extra de seguridad razonable mientras tanto.",
      },
    ],
  },
  {
    key: "faq",
    label: "Preguntas frecuentes",
    tips: [
      {
        title: "\"Mi página pública dice que no existe / da error 404\"",
        body: "Casi siempre es porque no la has publicado. Ve a Configuración → Marca y confirma que diga \"Tu página pública está activa\". Si acabas de publicarla y sigue sin verse, espera unos segundos y recarga.",
      },
      {
        title: "\"Un link del portal o de un correo me manda a localhost o da un error de enlace inválido\"",
        body: "Esto puede pasar si el link que abriste ya expiró (los links de acceso son de un solo uso y duran una hora) o si lo abriste dos veces. Pide un nuevo acceso desde /portal/login.",
      },
      {
        title: "\"El profesional/paciente/servicio aparece como un código raro en vez de su nombre\"",
        body: "Si ves esto en algún formulario, dinos exactamente en qué pantalla pasó — es un detalle visual que hemos ido corrigiendo en toda la app, pero avísanos si encuentras un lugar donde todavía ocurra.",
      },
      {
        title: "\"Un paciente dice que no le llegó el correo de confirmación\"",
        body: "Verifica primero que el paciente tenga un correo válido registrado en su ficha (sin errores de digitación) y que haya revisado spam/promociones. Si el correo se creó desde \"Nueva cita\" en el dashboard, también envía confirmación igual que la reserva pública.",
      },
      {
        title: "\"No encuentro dónde agregar/editar profesionales\"",
        body: "Menú lateral → General → Profesionales. Ahí puedes crear, editar y desactivar en cualquier momento, no solo durante el registro inicial.",
      },
      {
        title: "\"No sé dónde está Configuración\"",
        body: "Menú lateral → grupo \"Cuenta\" (al final, puede requerir bajar el menú) → Configuración. Desde ahí accedes a Horarios, Marca, Servicios, Pagos y Consentimientos.",
      },
      {
        title: "\"¿Por qué no veo cierto módulo del menú (Paquetes, Grupales, Recursos, etc.)?\"",
        body: "Esos módulos requieren el Plan Profesional o superior y, en algunos casos, el módulo específico activado. Si no los ves o ves una pantalla de \"módulo bloqueado\", revisa tu plan actual o escríbenos para actualizarlo.",
      },
      {
        title: "\"Subí un archivo y me dijo que es muy grande\"",
        body: "Los límites son: 15 MB para documentos de pacientes, 25 MB para recursos digitales, 5 MB para imágenes de marca (logo, portada, foto). Si necesitas algo más pesado, comprime el archivo o usa un link externo (YouTube/Drive) en la descripción.",
      },
      {
        title: "\"¿Dónde ve el paciente sus documentos?\"",
        body: "En su portal (/portal/login con su correo), pero solo ve los documentos que subiste SIN marcar como \"clínico\". Si necesitas que vea uno que ya subiste como clínico por error, tendrás que subirlo de nuevo sin marcar esa casilla.",
      },
      {
        title: "\"¿Cómo dejo de recibir reservas temporalmente?\"",
        body: "Despublica tu página desde Configuración → Marca. No se borra nada, solo deja de ser visible hasta que la vuelvas a publicar.",
      },
    ],
  },
];

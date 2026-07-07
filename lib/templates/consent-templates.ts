import type { Database } from "@/lib/supabase/types";

type ConsentDocumentType = Database["public"]["Enums"]["consent_document_type"];

/**
 * Textos base editables por cada consultorio. Redactados con lenguaje
 * responsable (ver AGENTS.md "Regla de responsabilidad legal y comercial"):
 * ningún texto promete cura, diagnóstico automático ni sustituye valoración
 * profesional. Referencian el marco colombiano (Ley 1581 de 2012, Resolución
 * 2654 de 2019, Resolución 2927 de 1998) solo como contexto, no como
 * asesoría jurídica — ver docs/LEGAL_CHECKLIST_COLOMBIA.md.
 */
export const CONSENT_TEMPLATES: Record<ConsentDocumentType, { title: string; body: string }> = {
  privacy_policy: {
    title: "Política de tratamiento de datos personales",
    body: `Este consultorio trata tus datos personales conforme a la Ley 1581 de 2012 y sus decretos reglamentarios. Recolectamos únicamente los datos necesarios para agendar, prestar y hacer seguimiento a tu servicio (nombre, documento, contacto, información de la cita y del pago). No compartimos tus datos con terceros salvo obligación legal o autorización expresa tuya. Puedes solicitar acceso, corrección o eliminación de tus datos escribiendo al contacto del consultorio.`,
  },
  data_authorization: {
    title: "Autorización de tratamiento de datos personales",
    body: `Autorizo a este consultorio a recolectar, almacenar y usar mis datos personales para la gestión de mis citas, pagos, recordatorios y seguimiento del servicio contratado, de acuerdo con la política de tratamiento de datos personales del consultorio y la normativa colombiana vigente.`,
  },
  sensitive_data_authorization: {
    title: "Autorización de datos sensibles (salud)",
    body: `Autorizo de forma expresa el tratamiento de mis datos sensibles relacionados con mi salud o bienestar, necesarios para la prestación del servicio que voy a recibir. Entiendo que estos datos se manejan con confidencialidad reforzada y solo son accesibles al personal autorizado del consultorio.`,
  },
  informed_consent_general: {
    title: "Consentimiento informado general",
    body: `He sido informado(a) sobre las características generales del servicio que voy a recibir, incluyendo su naturaleza, duración aproximada y recomendaciones previas. Entiendo que este servicio no reemplaza una valoración médica, odontológica, psicológica o psiquiátrica cuando esta sea necesaria, y que puedo solicitar información adicional antes de continuar.`,
  },
  teleconsultation_consent: {
    title: "Consentimiento para teleconsulta",
    body: `Acepto recibir este servicio de forma virtual (teleconsulta), entendiendo sus alcances y limitaciones frente a una atención presencial. Es mi responsabilidad contar con conexión estable y un espacio privado para la sesión. En caso de urgencia, acudiré a los servicios de atención presencial correspondientes.`,
  },
  service_specific_consent: {
    title: "Consentimiento específico del servicio",
    body: `He sido informado(a) sobre las particularidades de este servicio específico, sus recomendaciones previas y posteriores, y acepto continuar bajo esas condiciones. Cada profesional es responsable del alcance, formación, habilitación y cumplimiento normativo de los servicios que ofrece.`,
  },
  cancellation_policy: {
    title: "Política de cancelación",
    body: `Puedes cancelar o reprogramar tu cita según el tiempo mínimo indicado para cada servicio. Las cancelaciones fuera de ese plazo, o las inasistencias sin aviso, pueden implicar la pérdida parcial o total del anticipo pagado, según lo indicado en cada servicio.`,
  },
  refund_policy: {
    title: "Política de reembolso",
    body: `Los reembolsos se evalúan caso a caso según el motivo de la solicitud, el tiempo de anticipación y el estado del servicio contratado. El consultorio informará el resultado de la solicitud y el tiempo estimado de procesamiento.`,
  },
  terms_and_conditions: {
    title: "Términos y condiciones",
    body: `Al reservar un servicio en este consultorio aceptas estas condiciones generales de uso, incluyendo las políticas de cancelación, reembolso y tratamiento de datos personales aquí descritas. El consultorio se reserva el derecho de actualizar estos términos, notificando los cambios relevantes.`,
  },
  alternative_medicine_disclaimer: {
    title: "Aviso — Terapia alternativa o complementaria",
    body: `Este servicio puede ser complementario y no reemplaza una valoración médica, odontológica, psicológica o psiquiátrica cuando esta sea necesaria. Cada profesional es responsable del alcance, formación, habilitación y cumplimiento normativo de los servicios que ofrece.`,
  },
  wellness_disclaimer: {
    title: "Aviso — Servicio de bienestar",
    body: `Este es un servicio de bienestar y acompañamiento, no un tratamiento médico. No diagnostica ni cura enfermedades y no reemplaza la valoración de un profesional de la salud cuando esta sea necesaria.`,
  },
  non_clinical_disclaimer: {
    title: "Aviso — Servicio no clínico",
    body: `Este servicio es de carácter educativo o de acompañamiento y no constituye un tratamiento clínico ni terapéutico. No reemplaza la valoración de un profesional de la salud cuando esta sea necesaria.`,
  },
};

export const DEFAULT_CONSENT_TYPES: ConsentDocumentType[] = [
  "privacy_policy",
  "data_authorization",
  "informed_consent_general",
  "cancellation_policy",
  "terms_and_conditions",
];

const CLASSIFICATION_TO_DISCLAIMER: Partial<
  Record<Database["public"]["Enums"]["service_classification"], ConsentDocumentType>
> = {
  terapia_alternativa_complementaria: "alternative_medicine_disclaimer",
  servicio_bienestar: "wellness_disclaimer",
  servicio_educativo_acompanamiento: "non_clinical_disclaimer",
  servicio_no_clinico: "non_clinical_disclaimer",
  servicio_salud_habilitado: "sensitive_data_authorization",
};

export function suggestedConsentTypesForClassifications(
  classifications: Database["public"]["Enums"]["service_classification"][],
): ConsentDocumentType[] {
  const extra = classifications
    .map((c) => CLASSIFICATION_TO_DISCLAIMER[c])
    .filter((v): v is ConsentDocumentType => Boolean(v));
  return Array.from(new Set([...DEFAULT_CONSENT_TYPES, ...extra]));
}

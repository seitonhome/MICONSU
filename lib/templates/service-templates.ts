import type { PractitionerType } from "@/lib/auth/roles";
import type { Database } from "@/lib/supabase/types";

type ServiceClassification = Database["public"]["Enums"]["service_classification"];

export type ServiceTemplate = {
  name: string;
  durationMinutes: number;
  classification: ServiceClassification;
};

const MEDICO: ServiceTemplate[] = [
  { name: "Primera consulta", durationMinutes: 30, classification: "servicio_salud_habilitado" },
  { name: "Control médico", durationMinutes: 20, classification: "servicio_salud_habilitado" },
  { name: "Teleconsulta", durationMinutes: 20, classification: "servicio_salud_habilitado" },
  { name: "Certificado o revisión", durationMinutes: 15, classification: "servicio_salud_habilitado" },
  { name: "Seguimiento", durationMinutes: 20, classification: "servicio_salud_habilitado" },
];

const ODONTOLOGO: ServiceTemplate[] = [
  { name: "Valoración odontológica", durationMinutes: 30, classification: "servicio_salud_habilitado" },
  { name: "Limpieza dental", durationMinutes: 45, classification: "servicio_salud_habilitado" },
  { name: "Urgencia odontológica", durationMinutes: 30, classification: "servicio_salud_habilitado" },
  { name: "Control de ortodoncia", durationMinutes: 20, classification: "servicio_salud_habilitado" },
  { name: "Blanqueamiento", durationMinutes: 60, classification: "servicio_salud_habilitado" },
  { name: "Diseño de sonrisa", durationMinutes: 60, classification: "servicio_salud_habilitado" },
  { name: "Procedimiento personalizado", durationMinutes: 60, classification: "servicio_salud_habilitado" },
  { name: "Control post procedimiento", durationMinutes: 20, classification: "servicio_salud_habilitado" },
];

const PSICOLOGO: ServiceTemplate[] = [
  { name: "Primera sesión", durationMinutes: 50, classification: "servicio_salud_habilitado" },
  { name: "Sesión individual", durationMinutes: 50, classification: "servicio_salud_habilitado" },
  { name: "Terapia de pareja", durationMinutes: 60, classification: "servicio_salud_habilitado" },
  { name: "Sesión virtual", durationMinutes: 50, classification: "servicio_salud_habilitado" },
  { name: "Control o seguimiento", durationMinutes: 30, classification: "servicio_salud_habilitado" },
];

const PSIQUIATRA: ServiceTemplate[] = [
  { name: "Primera consulta", durationMinutes: 45, classification: "servicio_salud_habilitado" },
  { name: "Control psiquiátrico", durationMinutes: 25, classification: "servicio_salud_habilitado" },
  { name: "Teleconsulta", durationMinutes: 25, classification: "servicio_salud_habilitado" },
  { name: "Evaluación", durationMinutes: 60, classification: "servicio_salud_habilitado" },
  { name: "Seguimiento", durationMinutes: 25, classification: "servicio_salud_habilitado" },
];

const FISIOTERAPIA: ServiceTemplate[] = [
  { name: "Valoración", durationMinutes: 40, classification: "servicio_salud_habilitado" },
  { name: "Sesión de fisioterapia", durationMinutes: 45, classification: "servicio_salud_habilitado" },
  { name: "Paquete de sesiones", durationMinutes: 45, classification: "servicio_salud_habilitado" },
  { name: "Control", durationMinutes: 20, classification: "servicio_salud_habilitado" },
  { name: "Rehabilitación", durationMinutes: 45, classification: "servicio_salud_habilitado" },
];

const NUTRICION: ServiceTemplate[] = [
  { name: "Primera consulta", durationMinutes: 45, classification: "servicio_salud_habilitado" },
  { name: "Control nutricional", durationMinutes: 30, classification: "servicio_salud_habilitado" },
  { name: "Plan de seguimiento", durationMinutes: 30, classification: "servicio_salud_habilitado" },
  { name: "Evaluación mensual", durationMinutes: 30, classification: "servicio_salud_habilitado" },
];

const INTEGRATIVA: ServiceTemplate[] = [
  { name: "Valoración inicial integrativa", durationMinutes: 60, classification: "terapia_alternativa_complementaria" },
  { name: "Consulta de seguimiento", durationMinutes: 40, classification: "terapia_alternativa_complementaria" },
  { name: "Plan de bienestar personalizado", durationMinutes: 45, classification: "terapia_alternativa_complementaria" },
  { name: "Teleconsulta integrativa", durationMinutes: 40, classification: "terapia_alternativa_complementaria" },
  { name: "Control mensual", durationMinutes: 30, classification: "terapia_alternativa_complementaria" },
];

const ACUPUNTURA: ServiceTemplate[] = [
  { name: "Valoración inicial", durationMinutes: 45, classification: "terapia_alternativa_complementaria" },
  { name: "Sesión de acupuntura", durationMinutes: 45, classification: "terapia_alternativa_complementaria" },
  { name: "Seguimiento terapéutico", durationMinutes: 30, classification: "terapia_alternativa_complementaria" },
  { name: "Paquete de sesiones", durationMinutes: 45, classification: "terapia_alternativa_complementaria" },
  { name: "Control de evolución", durationMinutes: 30, classification: "terapia_alternativa_complementaria" },
];

const HOMEOPATIA: ServiceTemplate[] = [
  { name: "Primera consulta homeopática", durationMinutes: 60, classification: "terapia_alternativa_complementaria" },
  { name: "Control homeopático", durationMinutes: 30, classification: "terapia_alternativa_complementaria" },
  { name: "Seguimiento mensual", durationMinutes: 30, classification: "terapia_alternativa_complementaria" },
  { name: "Consulta virtual", durationMinutes: 30, classification: "terapia_alternativa_complementaria" },
];

const TERAPIAS_ENERGETICAS: ServiceTemplate[] = [
  { name: "Sesión individual", durationMinutes: 60, classification: "terapia_alternativa_complementaria" },
  { name: "Armonización", durationMinutes: 45, classification: "terapia_alternativa_complementaria" },
  { name: "Seguimiento", durationMinutes: 30, classification: "terapia_alternativa_complementaria" },
  { name: "Paquete de sesiones", durationMinutes: 45, classification: "terapia_alternativa_complementaria" },
];

const BIOSANACION: ServiceTemplate[] = [
  { name: "Sesión inicial de lectura emocional", durationMinutes: 60, classification: "servicio_bienestar" },
  { name: "Sesión de biosanación", durationMinutes: 60, classification: "servicio_bienestar" },
  { name: "Proceso terapéutico individual", durationMinutes: 60, classification: "servicio_bienestar" },
  { name: "Sesión de seguimiento", durationMinutes: 45, classification: "servicio_bienestar" },
  { name: "Acompañamiento mensual", durationMinutes: 45, classification: "servicio_bienestar" },
];

const COACHING: ServiceTemplate[] = [
  { name: "Sesión de claridad", durationMinutes: 45, classification: "servicio_educativo_acompanamiento" },
  { name: "Sesión individual", durationMinutes: 60, classification: "servicio_educativo_acompanamiento" },
  { name: "Proceso de acompañamiento", durationMinutes: 60, classification: "servicio_educativo_acompanamiento" },
  { name: "Mentoría mensual", durationMinutes: 60, classification: "servicio_educativo_acompanamiento" },
  { name: "Sesión de cierre", durationMinutes: 45, classification: "servicio_educativo_acompanamiento" },
];

const TERAPIAS_CORPORALES: ServiceTemplate[] = [
  { name: "Valoración corporal", durationMinutes: 30, classification: "servicio_bienestar" },
  { name: "Masaje terapéutico", durationMinutes: 60, classification: "servicio_bienestar" },
  { name: "Terapia de relajación", durationMinutes: 60, classification: "servicio_bienestar" },
  { name: "Paquete de sesiones", durationMinutes: 60, classification: "servicio_bienestar" },
];

const RESPIRACION_MEDITACION: ServiceTemplate[] = [
  { name: "Sesión individual", durationMinutes: 45, classification: "servicio_bienestar" },
  { name: "Sesión grupal", durationMinutes: 60, classification: "servicio_bienestar" },
  { name: "Clase guiada", durationMinutes: 45, classification: "servicio_bienestar" },
  { name: "Programa de respiración", durationMinutes: 45, classification: "servicio_bienestar" },
  { name: "Acompañamiento virtual", durationMinutes: 45, classification: "servicio_bienestar" },
];

const GENERIC: ServiceTemplate[] = [
  { name: "Primera sesión", durationMinutes: 45, classification: "servicio_bienestar" },
  { name: "Sesión individual", durationMinutes: 45, classification: "servicio_bienestar" },
  { name: "Seguimiento", durationMinutes: 30, classification: "servicio_bienestar" },
];

export const SERVICE_TEMPLATES_BY_PRACTITIONER: Partial<Record<PractitionerType, ServiceTemplate[]>> = {
  medico_general: MEDICO,
  medico_especialista: MEDICO,
  odontologo: ODONTOLOGO,
  ortodoncista: ODONTOLOGO,
  psicologo: PSICOLOGO,
  psiquiatra: PSIQUIATRA,
  fisioterapeuta: FISIOTERAPIA,
  nutricionista: NUTRICION,
  medicina_funcional_integrativa: INTEGRATIVA,
  medicina_alternativa: INTEGRATIVA,
  acupuntura_mtc: ACUPUNTURA,
  homeopatia: HOMEOPATIA,
  ayurveda: TERAPIAS_ENERGETICAS,
  naturopatia: INTEGRATIVA,
  terapia_neural: ACUPUNTURA,
  quiropraxia: FISIOTERAPIA,
  osteopatia: FISIOTERAPIA,
  biomagnetismo: TERAPIAS_ENERGETICAS,
  bioenergetica: TERAPIAS_ENERGETICAS,
  reiki: TERAPIAS_ENERGETICAS,
  biosanacion_biodescodificacion: BIOSANACION,
  coaching_mentoria_emocional: COACHING,
  terapias_respiracion_meditacion: RESPIRACION_MEDITACION,
  terapias_corporales_masajes: TERAPIAS_CORPORALES,
};

export function getServiceTemplates(type: PractitionerType): ServiceTemplate[] {
  return SERVICE_TEMPLATES_BY_PRACTITIONER[type] ?? GENERIC;
}

export const APP_ROLES = [
  "super_admin",
  "clinic_owner",
  "professional",
  "assistant",
  "receptionist",
  "finance_user",
  "support_agent",
  "patient",
] as const;

export type AppRole = (typeof APP_ROLES)[number];

/**
 * Tipo de práctica del profesional. No otorga permisos por sí mismo — solo
 * adapta lenguaje, plantillas, disclaimers y clasificación de servicios.
 * Ver docs/00-ARQUITECTURA-Y-PLAN.md §8.
 */
export const PRACTITIONER_TYPES = [
  "medico_general",
  "medico_especialista",
  "odontologo",
  "ortodoncista",
  "psicologo",
  "psiquiatra",
  "fisioterapeuta",
  "nutricionista",
  "medicina_funcional_integrativa",
  "medicina_alternativa",
  "homeopatia",
  "acupuntura_mtc",
  "ayurveda",
  "naturopatia",
  "terapia_neural",
  "quiropraxia",
  "osteopatia",
  "biomagnetismo",
  "bioenergetica",
  "reiki",
  "biosanacion_biodescodificacion",
  "coaching_mentoria_emocional",
  "terapias_respiracion_meditacion",
  "terapias_corporales_masajes",
  "otro",
] as const;

export type PractitionerType = (typeof PRACTITIONER_TYPES)[number];

type Permission =
  | "agenda:view_all"
  | "agenda:view_own"
  | "patients:manage_admin_data"
  | "patients:view_own_only"
  | "clinical_notes:view"
  | "clinical_notes:view_own_only"
  | "payments:manage"
  | "payments:view_reports"
  | "config:manage"
  | "support:create_ticket"
  | "support:manage_all";

const ROLE_PERMISSIONS: Record<AppRole, Permission[]> = {
  super_admin: [],
  clinic_owner: [
    "agenda:view_all",
    "patients:manage_admin_data",
    "clinical_notes:view",
    "payments:manage",
    "payments:view_reports",
    "config:manage",
    "support:create_ticket",
  ],
  professional: [
    "agenda:view_own",
    "patients:view_own_only",
    "clinical_notes:view_own_only",
    "payments:view_reports",
    "support:create_ticket",
  ],
  assistant: ["agenda:view_all", "patients:manage_admin_data"],
  receptionist: ["agenda:view_all", "patients:manage_admin_data", "payments:manage"],
  finance_user: ["payments:manage", "payments:view_reports"],
  support_agent: ["support:manage_all"],
  patient: [],
};

export function roleHasPermission(role: AppRole, permission: Permission): boolean {
  if (role === "super_admin") return true;
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

export const DEFAULT_LABELS_BY_PRACTITIONER_TYPE: Partial<
  Record<PractitionerType, { patient: string; appointment: string; process: string }>
> = {
  psicologo: { patient: "paciente", appointment: "sesión", process: "proceso" },
  psiquiatra: { patient: "paciente", appointment: "sesión", process: "evolución" },
  odontologo: { patient: "paciente", appointment: "tratamiento", process: "plan odontológico" },
  ortodoncista: { patient: "paciente", appointment: "control", process: "plan odontológico" },
  biosanacion_biodescodificacion: {
    patient: "consultante",
    appointment: "sesión",
    process: "proceso",
  },
  coaching_mentoria_emocional: {
    patient: "consultante",
    appointment: "sesión",
    process: "acompañamiento",
  },
  reiki: { patient: "cliente", appointment: "experiencia", process: "programa" },
};

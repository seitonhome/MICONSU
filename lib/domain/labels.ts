import type { Database } from "@/lib/supabase/types";

export const SERVICE_CLASSIFICATION_LABELS: Record<
  Database["public"]["Enums"]["service_classification"],
  string
> = {
  servicio_salud_habilitado: "Servicio de salud habilitado",
  terapia_alternativa_complementaria: "Terapia alternativa o complementaria",
  servicio_bienestar: "Servicio de bienestar",
  servicio_educativo_acompanamiento: "Servicio educativo o de acompañamiento",
  servicio_no_clinico: "Servicio no clínico",
};

export const MODALITY_LABELS: Record<"in_person" | "virtual" | "both", string> = {
  in_person: "Presencial",
  virtual: "Virtual",
  both: "Presencial y virtual",
};

export const APPOINTMENT_STATUS_LABELS: Record<
  Database["public"]["Enums"]["appointment_status"],
  string
> = {
  requested: "Solicitada",
  pending_payment: "Pendiente de pago",
  pending_manual_confirmation: "Pendiente de confirmación",
  confirmed: "Confirmada",
  paid: "Pagada",
  checked_in: "Registrada (check-in)",
  in_progress: "En curso",
  completed: "Completada",
  cancelled: "Cancelada",
  rescheduled: "Reprogramada",
  no_show: "No asistió",
  expired: "Expirada",
};

export const PAYMENT_STATUS_LABELS: Record<Database["public"]["Enums"]["payment_status"], string> = {
  pending: "Pendiente",
  pending_confirmation: "Pendiente de confirmación",
  approved: "Aprobado",
  rejected: "Rechazado",
  cancelled: "Cancelado",
  expired: "Expirado",
  refunded: "Reembolsado",
  partially_refunded: "Reembolsado parcialmente",
  failed: "Fallido",
  manual_review: "En revisión manual",
};

export const WEEKDAY_LABELS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

export const SUPPORT_TICKET_CATEGORY_LABELS: Record<
  Database["public"]["Enums"]["support_ticket_category"],
  string
> = {
  acceso: "Acceso",
  agenda: "Agenda",
  pagos: "Pagos",
  pasarelas: "Pasarelas",
  recordatorios: "Recordatorios",
  pagina_publica: "Página pública",
  pacientes: "Pacientes",
  reportes: "Reportes",
  diseno: "Diseño",
  soporte_legal_documentos: "Soporte legal / documentos",
  configuracion: "Configuración",
  error_tecnico: "Error técnico",
  solicitud_mejora: "Solicitud de mejora",
  backup_restauracion: "Backup / restauración",
  seguridad: "Seguridad",
};

export const SUPPORT_TICKET_PRIORITY_LABELS: Record<
  Database["public"]["Enums"]["support_ticket_priority"],
  string
> = {
  critical: "Crítica",
  high: "Alta",
  medium: "Media",
  low: "Baja",
};

export const SUPPORT_TICKET_STATUS_LABELS: Record<
  Database["public"]["Enums"]["support_ticket_status"],
  string
> = {
  open: "Abierto",
  in_review: "En revisión",
  waiting_client: "Esperando al cliente",
  in_progress: "En progreso",
  resolved: "Resuelto",
  closed: "Cerrado",
  escalated: "Escalado",
};

export const LICENSE_STATUS_LABELS: Record<string, string> = {
  active: "Activa",
  trial: "Prueba",
  suspended: "Suspendida",
  expired: "Vencida",
  cancelled: "Cancelada",
};

export const SUPPORT_SUBSCRIPTION_STATUS_LABELS: Record<string, string> = {
  active: "Activo",
  expiring_soon: "Por vencer",
  expired: "Vencido",
  suspended: "Suspendido",
};

export const MODULE_KEY_LABELS: Record<Database["public"]["Enums"]["module_key"], string> = {
  extra_professional: "Profesional adicional",
  extra_location: "Sede adicional",
  extra_payment_gateway: "Pasarela adicional",
  whatsapp_automation: "WhatsApp automático",
  sms: "SMS",
  advanced_telehealth: "Teleconsulta avanzada",
  advanced_clinical_history: "Historia clínica avanzada",
  custom_domain: "Dominio personalizado",
  data_migration: "Migración de datos",
  extra_training: "Capacitación adicional",
  priority_support: "Soporte prioritario",
  advanced_therapeutic_packages: "Paquetes terapéuticos avanzados",
  group_workshops: "Talleres grupales",
  digital_resources: "Recursos digitales",
  premium_reports: "Reportes premium",
  premium_visual_customization: "Personalización visual premium",
};

export const MODULE_KEYS = Object.keys(MODULE_KEY_LABELS) as Database["public"]["Enums"]["module_key"][];

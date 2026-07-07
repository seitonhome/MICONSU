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

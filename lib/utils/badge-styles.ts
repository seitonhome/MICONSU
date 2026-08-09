// Clases de color semánticas para <Badge variant="outline" className={...}>,
// según el rediseño visual (design_handoff_visual_redesign/README.md):
// primary = confirmado/en curso/configurado, accent = activo/completado/
// aprobado, outline = pendiente/inactivo/sin configurar, destructive =
// cancelado/no-show/rechazado.
export const BADGE_PRIMARY = "border-transparent bg-primary/[0.14] text-primary";
export const BADGE_ACCENT = "border-transparent bg-accent/[0.28] text-accent-foreground";
export const BADGE_OUTLINE = "border-black/[0.14] text-muted-foreground";
export const BADGE_DESTRUCTIVE = "border-transparent bg-destructive/[0.12] text-destructive";

// Compartido entre la lista de tickets y el detalle de ticket, para que el
// mismo estado se vea del mismo color sin importar desde dónde se mire.
export const TICKET_STATUS_BADGE_CLASS: Record<string, string> = {
  open: BADGE_OUTLINE,
  in_review: BADGE_PRIMARY,
  waiting_client: BADGE_PRIMARY,
  in_progress: BADGE_PRIMARY,
  resolved: BADGE_ACCENT,
  closed: BADGE_OUTLINE,
  escalated: BADGE_DESTRUCTIVE,
};

// Compartido entre Agenda y la ficha del paciente (pestaña Citas).
export const APPOINTMENT_STATUS_BADGE_CLASS: Record<string, string> = {
  requested: BADGE_OUTLINE,
  pending_payment: BADGE_OUTLINE,
  pending_manual_confirmation: BADGE_OUTLINE,
  confirmed: BADGE_PRIMARY,
  paid: BADGE_PRIMARY,
  checked_in: BADGE_PRIMARY,
  in_progress: BADGE_PRIMARY,
  completed: BADGE_ACCENT,
  cancelled: BADGE_DESTRUCTIVE,
  no_show: BADGE_DESTRUCTIVE,
  rescheduled: BADGE_OUTLINE,
  expired: BADGE_DESTRUCTIVE,
};

// Compartido en la ficha del paciente (pestaña Pagos) y el portal.
export const PAYMENT_STATUS_BADGE_CLASS: Record<string, string> = {
  pending: BADGE_OUTLINE,
  pending_confirmation: BADGE_OUTLINE,
  manual_review: BADGE_OUTLINE,
  approved: BADGE_ACCENT,
  rejected: BADGE_DESTRUCTIVE,
  cancelled: BADGE_DESTRUCTIVE,
  expired: BADGE_DESTRUCTIVE,
  failed: BADGE_DESTRUCTIVE,
  refunded: BADGE_PRIMARY,
  partially_refunded: BADGE_PRIMARY,
};

// Clases de color semánticas para <Badge variant="outline" className={...}>,
// según el rediseño visual (design_handoff_visual_redesign/README.md):
// primary = confirmado/en curso/configurado, accent = activo/completado/
// aprobado, outline = pendiente/inactivo/sin configurar, destructive =
// cancelado/no-show/rechazado.
export const BADGE_PRIMARY = "border-transparent bg-primary/[0.14] text-primary";
export const BADGE_ACCENT = "border-transparent bg-accent/[0.28] text-accent-foreground";
export const BADGE_OUTLINE = "border-black/[0.14] text-muted-foreground";
export const BADGE_DESTRUCTIVE = "border-transparent bg-destructive/[0.12] text-destructive";

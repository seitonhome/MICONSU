export type OnboardingStep = {
  id: number;
  slug: string;
  title: string;
  shortTitle: string;
};

export const ONBOARDING_STEPS: OnboardingStep[] = [
  { id: 1, slug: "datos", title: "Datos del consultorio", shortTitle: "Datos" },
  { id: 2, slug: "marca", title: "Logo y colores", shortTitle: "Marca" },
  { id: 3, slug: "practica", title: "Tipo de práctica", shortTitle: "Práctica" },
  { id: 4, slug: "profesionales", title: "Profesionales", shortTitle: "Equipo" },
  { id: 5, slug: "sedes", title: "Sedes o modalidad virtual", shortTitle: "Sedes" },
  { id: 6, slug: "servicios", title: "Servicios", shortTitle: "Servicios" },
  { id: 7, slug: "horarios", title: "Horarios", shortTitle: "Horarios" },
  { id: 8, slug: "pagos", title: "Pagos", shortTitle: "Pagos" },
  { id: 9, slug: "consentimientos", title: "Consentimientos", shortTitle: "Legal" },
  { id: 10, slug: "pagina-publica", title: "Tu página pública", shortTitle: "Página" },
  { id: 11, slug: "prueba-reserva", title: "Prueba de reserva", shortTitle: "Prueba" },
  { id: 12, slug: "publicacion", title: "Publicación", shortTitle: "Publicar" },
];

export function stepById(id: number): OnboardingStep {
  return ONBOARDING_STEPS.find((s) => s.id === id) ?? ONBOARDING_STEPS[0];
}

export function clampStep(raw: string): number {
  const n = Number.parseInt(raw, 10);
  if (Number.isNaN(n) || n < 1) return 1;
  if (n > ONBOARDING_STEPS.length) return ONBOARDING_STEPS.length;
  return n;
}

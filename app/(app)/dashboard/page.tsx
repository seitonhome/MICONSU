import { requireCurrentProfile } from "@/lib/auth/session";

// Placeholder — el dashboard con métricas, oportunidades y reportes básicos
// se construye en la tarea "Dashboard principal + reportes básicos".
export default async function DashboardPage() {
  const profile = await requireCurrentProfile();

  return (
    <div>
      <h1 className="text-2xl font-semibold">Hola, {profile.fullName.split(" ")[0] || "de nuevo"}</h1>
      <p className="mt-1 text-muted-foreground">
        Tu panel de consultorio está en construcción. Pronto verás aquí tus citas de hoy, pagos
        pendientes y oportunidades de tu consultorio.
      </p>
    </div>
  );
}

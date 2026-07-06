import Link from "next/link";
import { Button } from "@/components/ui/button";

// Placeholder — la landing comercial completa (17 secciones) se construye
// en la tarea "Landing comercial + modo demo".
export default function MarketingHomePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-4 text-center">
      <h1 className="text-3xl font-semibold tracking-tight md:text-5xl">
        Convierte tu consultorio en una experiencia profesional
      </h1>
      <p className="max-w-xl text-muted-foreground">
        Agenda, pacientes, pagos, recordatorios y soporte en un solo sistema para salud,
        odontología, terapias y bienestar.
      </p>
      <div className="flex gap-3">
        <Button render={<Link href="/register" />}>Crear mi consultorio</Button>
        <Button render={<Link href="/demo/alternativa" />} variant="outline">
          Ver cómo funciona
        </Button>
      </div>
    </div>
  );
}

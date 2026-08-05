import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 px-4 text-center">
      <p className="text-sm font-medium text-muted-foreground">Mi Consultorio Pro</p>
      <h1 className="text-2xl font-semibold">No encontramos esta página</h1>
      <p className="max-w-sm text-sm text-muted-foreground">
        El enlace puede haber cambiado o ya no existe. Revisa la dirección o vuelve al inicio.
      </p>
      <Button className="mt-2" render={<Link href="/login" />}>
        Ir al inicio
      </Button>
    </div>
  );
}

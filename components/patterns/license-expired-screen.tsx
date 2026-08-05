import { Lock, Download, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { signOut } from "@/app/(app)/actions";

export function LicenseExpiredScreen({
  clinicName,
  isOwner,
  endsAt,
}: {
  clinicName: string;
  isOwner: boolean;
  endsAt: string | null;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4">
      <div className="w-full max-w-md space-y-6 rounded-2xl border bg-background p-8 text-center shadow-sm">
        <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-destructive/10">
          <Lock className="size-6 text-destructive" />
        </div>
        <div>
          <h1 className="text-xl font-semibold">Tu plan anual venció</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {clinicName} dejó de tener acceso a la agenda, pacientes, pagos y demás funciones de Mi Consultorio Pro
            {endsAt ? ` desde el ${new Date(endsAt).toLocaleDateString("es-CO")}` : ""}. Ninguno de tus datos se
            eliminó ni se ocultó — solo se pausó el uso del sistema hasta que renueves.
          </p>
        </div>

        {isOwner ? (
          <div className="space-y-3">
            <a
              href="mailto:servicioalcliente@seitonhome.com?subject=Renovar%20mi%20plan%20de%20Mi%20Consultorio%20Pro"
              className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground"
            >
              <MessageCircle className="size-4" /> Renovar mi plan
            </a>
            <a
              href="/api/export/clinic-data"
              className="inline-flex w-full items-center justify-center gap-2 rounded-full border px-5 py-3 text-sm font-semibold"
            >
              <Download className="size-4" /> Descargar mis datos
            </a>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Pídele al dueño del consultorio que renueve el plan para volver a tener acceso.
          </p>
        )}

        <form action={signOut}>
          <Button type="submit" variant="ghost" size="sm" className="w-full">
            Cerrar sesión
          </Button>
        </form>
      </div>
    </div>
  );
}

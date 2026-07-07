import Link from "next/link";
import { Clock, Palette, Stethoscope, CreditCard, ShieldCheck } from "lucide-react";
import { requireRole } from "@/lib/auth/session";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

const SETTINGS_LINKS = [
  {
    href: "/dashboard/configuracion/horarios",
    icon: Clock,
    title: "Horarios",
    description: "Disponibilidad por profesional, bloqueos y vacaciones.",
  },
  {
    href: "/dashboard/configuracion/marca",
    icon: Palette,
    title: "Marca y tema visual",
    description: "Logo, colores y tema de tu página pública.",
  },
  {
    href: "/dashboard/servicios",
    icon: Stethoscope,
    title: "Servicios",
    description: "Catálogo de servicios, precios y duración.",
  },
  {
    href: "/dashboard/pagos",
    icon: CreditCard,
    title: "Pagos",
    description: "Métodos de pago y pasarelas configuradas.",
  },
  {
    href: "/dashboard/consentimientos",
    icon: ShieldCheck,
    title: "Consentimientos y legal",
    description: "Documentos, políticas y avisos de tu consultorio.",
  },
];

export default async function ConfiguracionPage() {
  await requireRole(["clinic_owner"]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Configuración</h1>
        <p className="mt-1 text-muted-foreground">Ajusta cómo funciona y se ve tu consultorio.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {SETTINGS_LINKS.map((item) => (
          <Link key={item.href} href={item.href}>
            <Card className="h-full transition-colors hover:border-primary">
              <CardHeader>
                <item.icon className="size-5 text-primary" />
                <CardTitle className="mt-2 text-base">{item.title}</CardTitle>
                <CardDescription>{item.description}</CardDescription>
              </CardHeader>
              <CardContent />
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}

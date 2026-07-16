import Link from "next/link";
import {
  CalendarDays,
  CreditCard,
  Globe,
  ShieldCheck,
  LifeBuoy,
  Stethoscope,
  Brain,
  Sparkles,
  Smile,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { ThemeProvider } from "@/components/themes/theme-provider";

export default function MarketingHomePage() {
  return (
    <ThemeProvider theme="clinico_moderno" className="min-h-screen bg-background">
      {/* 1. Hero principal */}
      <section className="border-b bg-gradient-to-b from-muted/40 to-background px-4 py-20 text-center">
        <div className="mx-auto max-w-3xl">
          <Badge variant="secondary" className="mb-4">
            Para salud, odontología, terapias, bienestar y medicina alternativa
          </Badge>
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
            Convierte tu consultorio en una experiencia profesional
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-lg text-muted-foreground">
            Agenda, pacientes, pagos, recordatorios y soporte en un solo sistema para salud, odontología,
            terapias y bienestar.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button size="lg" render={<Link href="/register" />}>
              Crear mi consultorio
            </Button>
            <Button size="lg" variant="outline" render={<Link href="/demo/alternativa" />}>
              Ver cómo funciona
            </Button>
          </div>
        </div>
      </section>

      {/* 2. Problema */}
      <section className="border-b px-4 py-16">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-2xl font-semibold">¿Te suena familiar?</h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Si hoy manejas tu consultorio entre WhatsApp, notas, Excel, transferencias y recordatorios
            manuales, estás perdiendo tiempo, orden y oportunidades de ingreso.
          </p>
        </div>
      </section>

      {/* 3. Solución */}
      <section className="border-b bg-muted/20 px-4 py-16">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-2xl font-semibold">Todo en un solo lugar</h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Centraliza reservas, pagos, pacientes, consentimientos y seguimiento en una plataforma visual,
            segura y fácil de usar.
          </p>
        </div>
      </section>

      {/* 4-7. Beneficios por vertical */}
      <section className="border-b px-4 py-16">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-center text-2xl font-semibold">Diseñado para tu tipo de práctica</h2>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <BenefitCard
              icon={Stethoscope}
              title="Médicos y odontólogos"
              items={[
                "Agenda por profesional y sede",
                "Historial de citas y pagos por paciente",
                "Recordatorios que reducen inasistencias",
              ]}
            />
            <BenefitCard
              icon={Smile}
              title="Odontología"
              items={[
                "Unidades odontológicas por sede",
                "Planes y procedimientos por paciente",
                "Página pública con tus servicios y precios",
              ]}
            />
            <BenefitCard
              icon={Brain}
              title="Psicología y psiquiatría"
              items={[
                "Consentimientos y privacidad reforzada",
                "Notas y evolución protegidas por rol",
                "Recordatorios discretos, sin revelar el motivo",
              ]}
            />
            <BenefitCard
              icon={Sparkles}
              title="Terapias y medicina alternativa"
              items={[
                "Lenguaje y disclaimers responsables",
                "Paquetes de sesiones y procesos",
                "Página pública cálida y profesional",
              ]}
            />
          </div>
        </div>
      </section>

      {/* 8. Agenda inteligente */}
      <FeatureSection
        icon={CalendarDays}
        title="Agenda inteligente"
        description="Vistas diaria, semanal y por profesional. Bloqueos, horarios recurrentes, lista de espera para recuperar espacios cancelados, y estados claros para cada cita: solicitada, confirmada, pagada, completada o no asistió."
        reverse={false}
      />

      {/* 9. Centro de pagos multi-pasarela */}
      <FeatureSection
        icon={CreditCard}
        title="Centro de pagos multi-pasarela"
        description="Transferencia manual, pago presencial y Wompi listos desde el día uno, con arquitectura preparada para Mercado Pago, PayU, ePayco, Bold y PlaceToPay. Nunca guardamos datos de tarjetas ni exponemos tus llaves privadas."
        reverse
      />

      {/* 10. Página pública profesional */}
      <FeatureSection
        icon={Globe}
        title="Tu página pública, siempre lista"
        description="Cada consultorio y cada profesional tienen su propia página de reservas, con tu logo, colores, servicios y horarios disponibles. Compártela por WhatsApp, redes o tu sitio web."
        reverse={false}
      />

      {/* 11. Consentimientos y privacidad */}
      <FeatureSection
        icon={ShieldCheck}
        title="Consentimientos y privacidad"
        description="Política de datos, autorizaciones y consentimientos específicos por servicio, versionados y con evidencia legal (fecha, IP, versión aceptada). Row Level Security aísla los datos de cada consultorio."
        reverse
      />

      {/* 12. Soporte Continuidad Clínica */}
      <FeatureSection
        icon={LifeBuoy}
        title="Soporte Continuidad Clínica"
        description="Tickets con SLA según tu plan, backups documentados y un sistema que sigue funcionando incluso si tu soporte vence. Tu consultorio, con respaldo real."
        reverse={false}
      />

      {/* 13. Demo visual del sistema */}
      <section className="border-b bg-muted/20 px-4 py-16 text-center">
        <div className="mx-auto max-w-2xl">
          <h2 className="text-2xl font-semibold">Míralo funcionando</h2>
          <p className="mt-4 text-muted-foreground">
            Explora una demo real de un consultorio de medicina alternativa: agenda, pagos, pacientes y
            página pública, con datos de ejemplo.
          </p>
          <Button size="lg" className="mt-6" render={<Link href="/demo/alternativa" />}>
            Ver demo en vivo
          </Button>
        </div>
      </section>

      {/* 14. Testimonios */}
      <section className="border-b px-4 py-16">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-center text-2xl font-semibold">Lo que dicen los consultorios que lo usan</h2>
          <div className="mt-10 grid gap-6 sm:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardContent className="pt-4">
                  <p className="text-sm text-muted-foreground italic">
                    &ldquo;Este espacio está reservado para el testimonio de un consultorio real que use Mi
                    Consultorio Pro.&rdquo;
                  </p>
                  <p className="mt-4 text-sm font-medium">Próximamente</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* 15. Planes */}
      <section className="border-b bg-muted/20 px-4 py-16">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-center text-2xl font-semibold">Planes desde un pago único + soporte</h2>
          <p className="mx-auto mt-3 max-w-xl text-center text-muted-foreground">
            No es una suscripción mensual obligatoria: es tu propio sistema, con soporte y continuidad.
          </p>
          <div className="mt-10 grid gap-6 lg:grid-cols-3">
            <PlanCard
              name="Esencial"
              description="1 profesional, 1 sede."
              features={[
                "Agenda y página pública",
                "Pacientes y servicios",
                "Pagos manuales + 1 pasarela automática",
                "Consentimientos y recordatorios por email",
                "Reportes básicos",
              ]}
            />
            <PlanCard
              name="Profesional"
              description="Hasta 3 profesionales, varias sedes."
              highlighted
              features={[
                "Centro de pagos multi-pasarela",
                "Conciliación avanzada y lista de espera",
                "Seguimiento postconsulta y reseñas",
                "Módulo clínico básico protegido",
                "Reportes avanzados y soporte prioritario",
              ]}
            />
            <PlanCard
              name="Centro"
              description="Multiusuario, varias sedes y unidades."
              features={[
                "Roles avanzados y auditoría",
                "Módulos activables",
                "Reportes de negocio",
                "Soporte prioritario",
                "Revisión mensual",
              ]}
            />
          </div>
        </div>
      </section>

      {/* 16. FAQ */}
      <section className="border-b px-4 py-16">
        <div className="mx-auto max-w-2xl">
          <h2 className="text-center text-2xl font-semibold">Preguntas frecuentes</h2>
          <Accordion className="mt-8">
            <AccordionItem value="datos">
              <AccordionTrigger>¿Qué tan seguros están los datos de mis pacientes?</AccordionTrigger>
              <AccordionContent>
                Cada consultorio tiene sus datos aislados mediante Row Level Security. Los documentos
                sensibles se guardan en almacenamiento privado, con enlaces firmados y auditoría de acceso.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="reemplaza">
              <AccordionTrigger>¿Reemplaza el WhatsApp que ya uso con mis pacientes?</AccordionTrigger>
              <AccordionContent>
                No lo reemplaza, lo organiza: tus pacientes reservan y reciben confirmaciones automáticas, y
                tú sigues pudiendo hablarles por WhatsApp cuando lo necesites.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="tiempo">
              <AccordionTrigger>¿Cuánto tiempo toma configurarlo?</AccordionTrigger>
              <AccordionContent>
                El asistente de configuración te guía en pocos pasos: datos, marca, servicios, horarios y
                pagos. La mayoría de consultorios publican su página el mismo día.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="alternativa">
              <AccordionTrigger>¿Sirve para medicina alternativa o terapias complementarias?</AccordionTrigger>
              <AccordionContent>
                Sí. El sistema adapta el lenguaje, los disclaimers y los consentimientos según el tipo de
                servicio. Cada profesional es responsable del alcance, formación, habilitación y
                cumplimiento normativo de los servicios que ofrece.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="soporte">
              <AccordionTrigger>¿Qué pasa si mi soporte vence?</AccordionTrigger>
              <AccordionContent>
                Tu sistema sigue funcionando y tus datos no se eliminan. Sin soporte activo no se garantizan
                actualizaciones, soporte prioritario ni restauraciones fuera de contrato, pero puedes renovar
                cuando quieras.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </section>

      {/* 17. CTA final */}
      <section className="px-4 py-20 text-center">
        <div className="mx-auto max-w-xl">
          <h2 className="text-2xl font-semibold">Deja de manejar tu consultorio entre WhatsApp y Excel</h2>
          <p className="mt-3 text-muted-foreground">
            Centraliza tu operación en un sistema profesional diseñado para ayudarte a atender mejor, cobrar
            mejor y trabajar con más tranquilidad.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Button size="lg" render={<Link href="/register" />}>
              Crear mi consultorio
            </Button>
            <Button size="lg" variant="outline" render={<Link href="/demo/alternativa" />}>
              Ver demo en vivo
            </Button>
          </div>
        </div>
      </section>
    </ThemeProvider>
  );
}

function BenefitCard({
  icon: Icon,
  title,
  items,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  items: string[];
}) {
  return (
    <Card>
      <CardHeader>
        <Icon className="size-5 text-primary" />
        <CardTitle className="mt-2 text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2 text-sm text-muted-foreground">
          {items.map((item) => (
            <li key={item} className="flex items-start gap-2">
              <Check className="mt-0.5 size-4 shrink-0 text-primary" />
              {item}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

function FeatureSection({
  icon: Icon,
  title,
  description,
  reverse,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  reverse: boolean;
}) {
  return (
    <section className="border-b px-4 py-16">
      <div className={`mx-auto flex max-w-4xl flex-col items-center gap-8 sm:flex-row ${reverse ? "sm:flex-row-reverse" : ""}`}>
        <div className="flex size-24 shrink-0 items-center justify-center rounded-3xl bg-primary/10">
          <Icon className="size-10 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-semibold sm:text-2xl">{title}</h2>
          <p className="mt-3 text-muted-foreground">{description}</p>
        </div>
      </div>
    </section>
  );
}

function PlanCard({
  name,
  description,
  features,
  highlighted,
}: {
  name: string;
  description: string;
  features: string[];
  highlighted?: boolean;
}) {
  return (
    <Card className={highlighted ? "ring-2 ring-primary" : undefined}>
      <CardHeader>
        {highlighted && <Badge className="mb-2 w-fit">Más elegido</Badge>}
        <CardTitle className="text-xl">{name}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2 text-sm">
          {features.map((f) => (
            <li key={f} className="flex items-start gap-2">
              <Check className="mt-0.5 size-4 shrink-0 text-primary" />
              {f}
            </li>
          ))}
        </ul>
        <Button className="mt-6 w-full" variant={highlighted ? "default" : "outline"} render={<Link href="/register" />}>
          Empezar
        </Button>
      </CardContent>
    </Card>
  );
}

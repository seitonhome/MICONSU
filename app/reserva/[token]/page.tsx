import { notFound } from "next/navigation";
import Link from "next/link";
import { CalendarCheck } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/server";
import { ThemeProvider, type VisualTheme } from "@/components/themes/theme-provider";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { APPOINTMENT_STATUS_LABELS } from "@/lib/domain/labels";
import { CancelBookingForm } from "./cancel-booking-form";

export default async function ManageBookingPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const admin = createAdminClient();

  const { data: appointment } = await admin
    .from("appointments")
    .select("*")
    .eq("booking_token", token)
    .single();

  if (!appointment) notFound();

  const [{ data: clinic }, { data: service }, { data: professional }, { data: patient }, { data: location }] =
    await Promise.all([
      admin.from("clinics").select("*").eq("id", appointment.clinic_id).single(),
      admin.from("services").select("*").eq("id", appointment.service_id).single(),
      admin.from("professionals").select("*").eq("id", appointment.professional_id).single(),
      admin.from("patients").select("*").eq("id", appointment.patient_id).single(),
      appointment.location_id
        ? admin.from("clinic_locations").select("*").eq("id", appointment.location_id).single()
        : Promise.resolve({ data: null }),
    ]);

  const { data: branding } = await admin
    .from("clinic_branding")
    .select("*")
    .eq("clinic_id", appointment.clinic_id)
    .maybeSingle();

  const startsAt = new Date(appointment.starts_at);
  const canCancel = !["cancelled", "completed", "no_show", "expired"].includes(appointment.status);

  return (
    <ThemeProvider
      theme={(branding?.visual_theme as VisualTheme) ?? "clinico_moderno"}
      primaryColor={branding?.primary_color}
      secondaryColor={branding?.secondary_color}
      className="min-h-screen bg-background"
    >
      <div className="mx-auto max-w-lg space-y-6 px-4 py-10">
        <div className="text-center">
          <CalendarCheck className="mx-auto size-10 text-primary" />
          <h1 className="mt-3 text-xl font-semibold">Hola, {patient?.full_name?.split(" ")[0]}</h1>
          <p className="mt-1 text-muted-foreground">Esta es la gestión de tu cita en {clinic?.commercial_name}.</p>
        </div>

        <div className="space-y-2 rounded-xl border p-4 text-sm">
          <div className="flex items-center justify-between">
            <p className="font-medium">{service?.name}</p>
            <Badge>{APPOINTMENT_STATUS_LABELS[appointment.status]}</Badge>
          </div>
          <p className="text-muted-foreground">
            {startsAt.toLocaleDateString("es-CO", { weekday: "long", day: "numeric", month: "long" })} ·{" "}
            {startsAt.toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" })}
          </p>
          <p className="text-muted-foreground">Con {professional?.full_name}</p>
          <p className="text-muted-foreground">
            {appointment.modality === "virtual" ? "Modalidad virtual" : location?.name ?? "Presencial"}
          </p>
          {service?.pre_instructions && (
            <p className="mt-2 rounded-lg bg-muted/30 p-2 text-xs">{service.pre_instructions}</p>
          )}
        </div>

        {canCancel ? (
          <div className="space-y-3">
            <CancelBookingForm token={token} />
            <p className="text-center text-xs text-muted-foreground">
              ¿Necesitas otro horario? Escríbenos y con gusto te ayudamos a reprogramar.
            </p>
          </div>
        ) : (
          <p className="text-center text-sm text-muted-foreground">Esta cita ya no admite cambios desde aquí.</p>
        )}

        <div className="text-center">
          <Button variant="link" render={<Link href={`/c/${clinic?.slug}`} />}>
            Ver más servicios de {clinic?.commercial_name}
          </Button>
        </div>
      </div>
    </ThemeProvider>
  );
}

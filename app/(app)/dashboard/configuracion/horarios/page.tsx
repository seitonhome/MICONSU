import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { AvailabilityForm } from "./availability-form";
import { BlockedTimeForm } from "./blocked-time-form";

export default async function HorariosPage() {
  const profile = await requireRole(["clinic_owner", "professional"]);
  const supabase = await createClient();

  const [{ data: professionals }, { data: availabilityRules }, { data: blockedTimes }] = await Promise.all([
    supabase
      .from("professionals")
      .select("*")
      .eq("clinic_id", profile.clinicId!)
      .is("deleted_at", null)
      .eq("is_active", true),
    supabase
      .from("availability_rules")
      .select("*")
      .eq("clinic_id", profile.clinicId!)
      .is("deleted_at", null)
      .order("day_of_week"),
    supabase
      .from("blocked_times")
      .select("*")
      .eq("clinic_id", profile.clinicId!)
      .gte("ends_at", new Date().toISOString())
      .order("starts_at"),
  ]);

  return (
    <div className="max-w-3xl space-y-10">
      <div>
        <h1 className="text-2xl font-semibold">Horarios</h1>
        <p className="mt-1 text-muted-foreground">
          Define cuándo está disponible cada profesional para recibir reservas, y bloquea fechas puntuales cuando lo necesites.
        </p>
      </div>

      <AvailabilityForm professionals={professionals ?? []} availabilityRules={availabilityRules ?? []} />
      <BlockedTimeForm professionals={professionals ?? []} blockedTimes={blockedTimes ?? []} />
    </div>
  );
}

import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

/**
 * Exportación completa de los datos del consultorio en JSON. Disponible
 * incluso si la licencia venció (ver app/(app)/layout.tsx) — vencer el plan
 * anual bloquea la operación del sistema, nunca el acceso a los propios
 * datos. Restringido a clinic_owner por ser una exportación masiva.
 */
const EXPORT_TABLES = [
  "clinics",
  "clinic_branding",
  "clinic_locations",
  "professionals",
  "professional_credentials",
  "service_categories",
  "services",
  "patients",
  "appointments",
  "waitlist_entries",
  "payment_intents",
  "payments",
  "manual_payment_proofs",
  "consent_documents",
  "consent_records",
  "patient_documents",
  "session_packages",
  "package_sessions",
  "group_sessions",
  "group_session_attendees",
  "resource_library",
  "assigned_resources",
  "post_consultation_followups",
  "reviews",
  "licenses",
  "support_subscriptions",
] as const;

const CLINIC_ID_FILTER: Partial<Record<(typeof EXPORT_TABLES)[number], string>> = {
  clinics: "id",
};

export async function GET() {
  const profile = await requireRole(["clinic_owner"]);
  const supabase = await createClient();
  const clinicId = profile.clinicId!;

  const results = await Promise.all(
    EXPORT_TABLES.map(async (table) => {
      const filterColumn = CLINIC_ID_FILTER[table] ?? "clinic_id";
      const { data, error } = await supabase.from(table).select("*").eq(filterColumn, clinicId);
      return [table, error ? [] : (data ?? [])] as const;
    }),
  );

  const payload = {
    exported_at: new Date().toISOString(),
    clinic_id: clinicId,
    data: Object.fromEntries(results),
  };

  return new NextResponse(JSON.stringify(payload, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="mi-consultorio-pro-datos-${clinicId}.json"`,
    },
  });
}

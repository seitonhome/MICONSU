import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";

export type LicenseType = "esencial" | "profesional" | "centro";
export type ModuleKey = Database["public"]["Enums"]["module_key"];

const PLAN_RANK: Record<LicenseType, number> = { esencial: 0, profesional: 1, centro: 2 };
const ENTITLED_STATUSES = new Set(["active", "trial"]);

export type ClinicEntitlements = {
  licenseType: LicenseType | null;
  licenseActive: boolean;
  /** true cuando hay licencia pero su fecha de vencimiento ya pasó (plan anual sin renovar). */
  licenseExpired: boolean;
  licenseEndsAt: string | null;
  enabledModules: Set<ModuleKey>;
  professionalsAllowed: number;
  locationsAllowed: number;
};

/**
 * Fuente única de verdad para "qué puede usar este consultorio": lee su
 * licencia (plan + estado + vencimiento) y sus módulos adicionales activos.
 *
 * Mi Consultorio Pro se vende como un solo plan completo y anual ($39
 * USD/año, incluye soporte — ver landing en seiton/mi-consultorio-pro), así
 * que create_clinic_and_assign_owner() otorga licencia 'centro' activa y
 * todos los módulos habilitados por 1 año desde el registro (migración
 * 20260802100000_annual_plan.sql). Al vencer `ends_at` sin renovación,
 * licenseActive pasa a false — app/(app)/layout.tsx usa esto para bloquear
 * la operación del consultorio (agenda, pacientes, pagos, etc.) sin borrar
 * ni ocultar sus datos: el dueño sigue pudiendo iniciar sesión para
 * exportarlos desde /api/export/clinic-data.
 */
export async function getClinicEntitlements(clinicId: string): Promise<ClinicEntitlements> {
  const supabase = await createClient();
  const [{ data: license }, { data: modules }] = await Promise.all([
    supabase
      .from("licenses")
      .select("license_type, status, ends_at, professionals_allowed, locations_allowed")
      .eq("clinic_id", clinicId)
      .maybeSingle(),
    supabase.from("enabled_modules").select("module_key").eq("clinic_id", clinicId).eq("is_active", true),
  ]);

  const expired = Boolean(license?.ends_at && new Date(license.ends_at).getTime() < Date.now());

  return {
    licenseType: (license?.license_type as LicenseType | undefined) ?? null,
    licenseActive: Boolean(license && ENTITLED_STATUSES.has(license.status) && !expired),
    licenseExpired: Boolean(license) && (expired || license?.status === "expired"),
    licenseEndsAt: license?.ends_at ?? null,
    enabledModules: new Set((modules ?? []).map((m) => m.module_key)),
    professionalsAllowed: license?.professionals_allowed ?? 1,
    locationsAllowed: license?.locations_allowed ?? 1,
  };
}

export function planAtLeast(entitlements: ClinicEntitlements, min: LicenseType): boolean {
  if (!entitlements.licenseActive || !entitlements.licenseType) return false;
  return PLAN_RANK[entitlements.licenseType] >= PLAN_RANK[min];
}

export function hasModule(entitlements: ClinicEntitlements, key: ModuleKey): boolean {
  return entitlements.enabledModules.has(key);
}


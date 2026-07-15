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
  enabledModules: Set<ModuleKey>;
  professionalsAllowed: number;
  locationsAllowed: number;
};

/**
 * Fuente única de verdad para "qué puede usar este consultorio": lee su
 * licencia (plan + estado) y sus módulos adicionales activos. Sin fila en
 * `licenses` (consultorio sin licencia asignada por el superadmin todavía)
 * se trata como no habilitado para nada por encima de Plan Esencial — el
 * sistema sigue funcionando, pero las funciones de Fase 2 quedan bloqueadas
 * hasta que haya una licencia activa, igual que describe el brief comercial.
 */
export async function getClinicEntitlements(clinicId: string): Promise<ClinicEntitlements> {
  const supabase = await createClient();
  const [{ data: license }, { data: modules }] = await Promise.all([
    supabase
      .from("licenses")
      .select("license_type, status, professionals_allowed, locations_allowed")
      .eq("clinic_id", clinicId)
      .maybeSingle(),
    supabase.from("enabled_modules").select("module_key").eq("clinic_id", clinicId).eq("is_active", true),
  ]);

  return {
    licenseType: (license?.license_type as LicenseType | undefined) ?? null,
    licenseActive: Boolean(license && ENTITLED_STATUSES.has(license.status)),
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

export const PLAN_LABELS: Record<LicenseType, string> = {
  esencial: "Plan Esencial",
  profesional: "Plan Profesional",
  centro: "Plan Centro",
};

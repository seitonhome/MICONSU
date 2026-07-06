import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { AppRole } from "@/lib/auth/roles";

export type CurrentProfile = {
  id: string;
  clinicId: string | null;
  role: AppRole;
  fullName: string;
  email: string | null;
  isActive: boolean;
};

/**
 * Devuelve el perfil del usuario autenticado o null. No redirige — úsalo en
 * páginas públicas o layouts que necesitan saber "quién está" sin exigirlo.
 */
export async function getCurrentProfile(): Promise<CurrentProfile | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, clinic_id, role, full_name, email, is_active")
    .eq("id", user.id)
    .single();

  if (!profile) return null;

  return {
    id: profile.id,
    clinicId: profile.clinic_id,
    role: profile.role,
    fullName: profile.full_name,
    email: profile.email,
    isActive: profile.is_active,
  };
}

/**
 * Igual que getCurrentProfile(), pero redirige a /login si no hay sesión.
 * Úsalo en el layout de (app) y (superadmin) para proteger todo el árbol.
 */
export async function requireCurrentProfile(): Promise<CurrentProfile> {
  const profile = await getCurrentProfile();
  if (!profile) {
    redirect("/login");
  }
  return profile;
}

export async function requireRole(allowed: AppRole[]): Promise<CurrentProfile> {
  const profile = await requireCurrentProfile();
  if (!allowed.includes(profile.role)) {
    redirect("/dashboard");
  }
  return profile;
}

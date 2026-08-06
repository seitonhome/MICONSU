"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { loginSchema } from "@/lib/validation/auth";
import { slugify } from "@/lib/utils/slugify";
import { checkRateLimit, getClientIp } from "@/lib/security/rate-limit";

export type AuthActionState = { error?: string };

export async function login(
  _prevState: AuthActionState | undefined,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  }

  const ip = await getClientIp();
  const [ipOk, emailOk] = await Promise.all([
    checkRateLimit(`login:ip:${ip}`, { max: 15, windowSeconds: 300 }),
    checkRateLimit(`login:email:${parsed.data.email.toLowerCase()}`, { max: 6, windowSeconds: 900 }),
  ]);
  if (!ipOk || !emailOk) {
    return { error: "Demasiados intentos. Espera unos minutos antes de volver a intentar." };
  }

  const supabase = await createClient();
  const { data: signInData, error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    return { error: "Correo o contraseña incorrectos." };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("clinic_id, role")
    .eq("id", signInData.user!.id)
    .maybeSingle();

  // El equipo del producto no tiene consultorio propio: mandarlo al
  // dashboard de clínica lo deja en una pantalla vacía sin navegación útil.
  if (profile?.role === "super_admin") {
    redirect("/admin");
  }

  // Si el registro se detuvo en "confirma tu correo" (signUp sin sesión
  // inmediata), create_clinic_and_assign_owner() nunca se llegó a ejecutar.
  // Este es el primer login con sesión real: si el perfil sigue sin
  // consultorio y quedó guardado el nombre pendiente en el registro,
  // completamos la creación aquí antes de mandarlo al dashboard vacío.
  const pendingClinicName = signInData.user?.user_metadata?.clinic_name as string | undefined;
  if (pendingClinicName) {
    if (profile && !profile.clinic_id) {
      const baseSlug = slugify(pendingClinicName) || "consultorio";
      let slug = baseSlug;

      for (let attempt = 0; attempt <= 5; attempt += 1) {
        const { error: clinicError } = await supabase.rpc("create_clinic_and_assign_owner", {
          p_commercial_name: pendingClinicName,
          p_slug: slug,
        });

        if (!clinicError) {
          redirect("/onboarding/1");
        }

        if (attempt === 5) break;
        slug = `${baseSlug}-${attempt + 1}`;
      }
    }
  }

  redirect("/dashboard");
}

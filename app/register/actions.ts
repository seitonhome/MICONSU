"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { registerSchema } from "@/lib/validation/auth";
import { slugify } from "@/lib/utils/slugify";
import { checkRateLimit, getClientIp } from "@/lib/security/rate-limit";
import type { AuthActionState } from "@/app/login/actions";

export async function register(
  _prevState: AuthActionState | undefined,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = registerSchema.safeParse({
    fullName: formData.get("fullName"),
    clinicName: formData.get("clinicName"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  }

  const { fullName, clinicName, email, password } = parsed.data;

  const ip = await getClientIp();
  const ok = await checkRateLimit(`register:ip:${ip}`, { max: 5, windowSeconds: 3600 });
  if (!ok) {
    return { error: "Demasiados intentos de registro. Espera un momento antes de volver a intentar." };
  }

  const supabase = await createClient();

  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/login`,
    },
  });

  if (signUpError) {
    return {
      error:
        signUpError.message === "User already registered"
          ? "Ya existe una cuenta con este correo."
          : "No pudimos crear tu cuenta. Intenta de nuevo.",
    };
  }

  if (!signUpData.session) {
    redirect("/login?checkEmail=1");
  }

  const baseSlug = slugify(clinicName) || "consultorio";
  let slug = baseSlug;

  for (let attempt = 0; attempt <= 5; attempt += 1) {
    const { error: clinicError } = await supabase.rpc("create_clinic_and_assign_owner", {
      p_commercial_name: clinicName,
      p_slug: slug,
    });

    if (!clinicError) break;

    if (attempt === 5) {
      return { error: "No pudimos crear tu consultorio. Contacta a soporte." };
    }

    slug = `${baseSlug}-${attempt + 1}`;
  }

  redirect("/onboarding/1");
}

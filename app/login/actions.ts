"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { loginSchema } from "@/lib/validation/auth";
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
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    return { error: "Correo o contraseña incorrectos." };
  }

  redirect("/dashboard");
}

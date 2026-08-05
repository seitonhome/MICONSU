"use server";

import { createClient } from "@/lib/supabase/server";
import { patientLoginSchema } from "@/lib/validation/auth";
import { checkRateLimit, getClientIp } from "@/lib/security/rate-limit";

export type PatientAuthActionState = { error?: string; sent?: boolean };

export async function requestPatientLink(
  _prevState: PatientAuthActionState | undefined,
  formData: FormData,
): Promise<PatientAuthActionState> {
  const parsed = patientLoginSchema.safeParse({ email: formData.get("email") });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  }

  const ip = await getClientIp();
  const [ipOk, emailOk] = await Promise.all([
    checkRateLimit(`portal-login:ip:${ip}`, { max: 10, windowSeconds: 900 }),
    checkRateLimit(`portal-login:email:${parsed.data.email.toLowerCase()}`, { max: 5, windowSeconds: 900 }),
  ]);
  if (!ipOk || !emailOk) {
    return { error: "Demasiados intentos. Espera unos minutos antes de volver a intentar." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email: parsed.data.email,
    options: {
      shouldCreateUser: true,
      data: { role: "patient" },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/portal/callback`,
    },
  });

  if (error) {
    return { error: "No pudimos enviar tu enlace de acceso. Intenta de nuevo." };
  }

  return { sent: true };
}

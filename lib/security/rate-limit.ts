import "server-only";
import { headers } from "next/headers";
import { createAdminClient } from "@/lib/supabase/server";

/**
 * Rate limiting basado en Postgres (tabla rate_limit_attempts), sin
 * dependencias externas. No es tan eficiente como Redis a gran escala, pero
 * cierra el hueco real: protege login, registro y reservas públicas contra
 * abuso automatizado con lo que ya está disponible en el stack.
 */
export async function checkRateLimit(
  bucketKey: string,
  opts: { max: number; windowSeconds: number },
): Promise<boolean> {
  const admin = createAdminClient();
  const windowStart = new Date(Date.now() - opts.windowSeconds * 1000).toISOString();

  const { count } = await admin
    .from("rate_limit_attempts")
    .select("id", { count: "exact", head: true })
    .eq("bucket_key", bucketKey)
    .gte("created_at", windowStart);

  if ((count ?? 0) >= opts.max) return false;

  await admin.from("rate_limit_attempts").insert({ bucket_key: bucketKey });

  // Limpieza oportunista de intentos viejos (best-effort, no bloquea la respuesta).
  void admin.from("rate_limit_attempts").delete().lt("created_at", new Date(Date.now() - 24 * 3600000).toISOString());

  return true;
}

export async function getClientIp(): Promise<string> {
  const h = await headers();
  const forwardedFor = h.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0].trim();
  return h.get("x-real-ip") ?? "unknown";
}

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/lib/supabase/types";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Se llama desde un Server Component sin permiso de escritura de
            // cookies (no hay middleware en este proyecto — se eliminó por
            // causar fallos de plataforma, ver df116cc). Es seguro ignorar
            // aquí porque cualquier refresco real de sesión ocurre en un
            // Server Action o Route Handler, que sí puede escribir cookies.
          }
        },
      },
    },
  );
}

/**
 * Cliente con service_role para operaciones que deben saltar RLS de forma controlada
 * (ej. jobs internos, webhooks verificados). Nunca usar en código expuesto al cliente.
 */
export function createAdminClient() {
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll() {
          return [];
        },
        setAll() {
          // El cliente admin no maneja sesión de usuario.
        },
      },
    },
  );
}

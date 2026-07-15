import "server-only";
import { headers } from "next/headers";
import { createAdminClient } from "@/lib/supabase/server";

/**
 * Escribe en audit_logs desde el servidor (cliente admin, nunca desde el
 * navegador). Se usa en acciones sensibles: credenciales de pasarela de pago,
 * cambios de rol de staff, borrado de datos de pacientes.
 */
export async function logAudit(params: {
  clinicId: string | null;
  actorProfileId: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  beforeData?: unknown;
  afterData?: unknown;
}): Promise<void> {
  const admin = createAdminClient();
  const h = await headers();
  const forwardedFor = h.get("x-forwarded-for");
  const ipAddress = forwardedFor ? forwardedFor.split(",")[0].trim() : (h.get("x-real-ip") ?? null);

  await admin.from("audit_logs").insert({
    clinic_id: params.clinicId,
    actor_profile_id: params.actorProfileId,
    action: params.action,
    entity_type: params.entityType,
    entity_id: params.entityId ?? null,
    before_data: (params.beforeData as never) ?? null,
    after_data: (params.afterData as never) ?? null,
    ip_address: ipAddress,
    user_agent: h.get("user-agent"),
  });
}

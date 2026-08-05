import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { logAudit } from "@/lib/security/audit";

/**
 * Extiende la licencia anual de un consultorio 1 año, llamado por el webhook
 * de Hotmart en seiton cuando detecta una recarga de suscripción (renovación,
 * no compra nueva) para Mi Consultorio Pro. Protegido con un secreto
 * compartido — nunca expuesto al navegador, solo servidor-a-servidor.
 *
 * Busca el consultorio por el email del clinic_owner (no hay otro
 * identificador compartido entre los dos proyectos: seiton solo conoce el
 * correo del comprador de Hotmart).
 */
export async function POST(request: NextRequest) {
  const secret = process.env.RENEWAL_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "RENEWAL_WEBHOOK_SECRET no configurado." }, { status: 500 });
  }
  if (request.headers.get("x-renewal-secret") !== secret) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as { email?: string } | null;
  const email = body?.email?.trim().toLowerCase();
  if (!email) {
    return NextResponse.json({ error: "email es obligatorio." }, { status: 400 });
  }

  const admin = createAdminClient();

  const { data: profile } = await admin
    .from("profiles")
    .select("id, clinic_id")
    .eq("role", "clinic_owner")
    .ilike("email", email)
    .not("clinic_id", "is", null)
    .maybeSingle();

  if (!profile?.clinic_id) {
    return NextResponse.json({ error: "No se encontró un consultorio para ese correo.", renewed: false }, { status: 404 });
  }

  const { data: clinic } = await admin.from("clinics").select("commercial_name").eq("id", profile.clinic_id).maybeSingle();

  const now = Date.now();
  const oneYearMs = 365 * 24 * 60 * 60 * 1000;

  const { data: license } = await admin.from("licenses").select("ends_at").eq("clinic_id", profile.clinic_id).maybeSingle();
  const licenseBase = license?.ends_at && new Date(license.ends_at).getTime() > now ? new Date(license.ends_at).getTime() : now;
  const newLicenseEndsAt = new Date(licenseBase + oneYearMs).toISOString();

  await admin
    .from("licenses")
    .update({ ends_at: newLicenseEndsAt, status: "active" })
    .eq("clinic_id", profile.clinic_id);

  const { data: subscription } = await admin
    .from("support_subscriptions")
    .select("ends_at")
    .eq("clinic_id", profile.clinic_id)
    .maybeSingle();
  const subBase =
    subscription?.ends_at && new Date(subscription.ends_at).getTime() > now ? new Date(subscription.ends_at).getTime() : now;
  const newSubEndsAt = new Date(subBase + oneYearMs).toISOString().slice(0, 10);

  await admin
    .from("support_subscriptions")
    .update({ ends_at: newSubEndsAt, status: "active" })
    .eq("clinic_id", profile.clinic_id);

  await logAudit({
    clinicId: profile.clinic_id,
    actorProfileId: null,
    action: "renew",
    entityType: "licenses",
    entityId: profile.clinic_id,
    afterData: { ends_at: newLicenseEndsAt, source: "hotmart_renewal_webhook" },
  });

  return NextResponse.json({
    renewed: true,
    clinicName: clinic?.commercial_name ?? null,
    licenseEndsAt: newLicenseEndsAt,
  });
}

"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/session";
import type { Database } from "@/lib/supabase/types";
import { MAX_BRANDING_IMAGE_BYTES, formatMaxSize } from "@/lib/storage/limits";

export type BrandingActionState = { error?: string; success?: boolean };

export async function updateClinicBranding(
  _prev: BrandingActionState | undefined,
  formData: FormData,
): Promise<BrandingActionState> {
  const profile = await requireRole(["clinic_owner"]);
  const supabase = await createClient();
  const clinicId = profile.clinicId!;

  const commercialName = (formData.get("commercial_name") as string)?.trim();
  const logoFile = formData.get("logo") as File | null;
  const coverFile = formData.get("cover_image") as File | null;
  const photoFile = formData.get("professional_photo") as File | null;
  const primaryColor = formData.get("primary_color") as string;
  const secondaryColor = formData.get("secondary_color") as string;
  const visualTheme = formData.get("visual_theme") as Database["public"]["Enums"]["visual_theme"];
  const fontStyle = (formData.get("font_style") as string) || "default";

  if (!commercialName) return { error: "El nombre comercial es obligatorio." };

  for (const [file, label] of [
    [logoFile, "El logo"],
    [coverFile, "La imagen de portada"],
    [photoFile, "La foto profesional"],
  ] as const) {
    if (file && file.size > MAX_BRANDING_IMAGE_BYTES) {
      return { error: `${label} supera el tamaño máximo permitido (${formatMaxSize(MAX_BRANDING_IMAGE_BYTES)}).` };
    }
  }

  async function uploadImage(file: File, prefix: string): Promise<string | undefined> {
    if (!file || file.size === 0) return undefined;
    const ext = file.name.split(".").pop() || "png";

    // Cada actualización de marca sube un archivo con nombre único (timestamp), así que
    // sin esto la imagen anterior de este tipo queda huérfana en el bucket para siempre.
    const { data: existing } = await supabase.storage.from("branding").list(clinicId, { search: prefix });
    const toRemove = (existing ?? [])
      .filter((f) => f.name.startsWith(`${prefix}-`))
      .map((f) => `${clinicId}/${f.name}`);
    if (toRemove.length > 0) {
      await supabase.storage.from("branding").remove(toRemove);
    }

    const path = `${clinicId}/${prefix}-${Date.now()}.${ext}`;
    const { error: uploadError } = await supabase.storage.from("branding").upload(path, file, {
      upsert: true,
      contentType: file.type || undefined,
    });
    if (uploadError) return undefined;
    return supabase.storage.from("branding").getPublicUrl(path).data.publicUrl;
  }

  const [logoUrl, coverUrl, photoUrl] = await Promise.all([
    logoFile ? uploadImage(logoFile, "logo") : Promise.resolve(undefined),
    coverFile ? uploadImage(coverFile, "cover") : Promise.resolve(undefined),
    photoFile ? uploadImage(photoFile, "professional") : Promise.resolve(undefined),
  ]);

  const { error: clinicError } = await supabase
    .from("clinics")
    .update({ commercial_name: commercialName })
    .eq("id", clinicId);
  if (clinicError) return { error: "No pudimos guardar el nombre comercial." };

  const { error } = await supabase
    .from("clinic_branding")
    .update({
      primary_color: primaryColor,
      secondary_color: secondaryColor,
      visual_theme: visualTheme,
      font_style: fontStyle,
      ...(logoUrl ? { logo_url: logoUrl } : {}),
      ...(coverUrl ? { cover_image_url: coverUrl } : {}),
      ...(photoUrl ? { professional_photo_url: photoUrl } : {}),
    })
    .eq("clinic_id", clinicId);

  if (error) return { error: "No pudimos guardar los cambios." };

  revalidatePath("/dashboard/configuracion/marca");
  revalidatePath("/dashboard", "layout");
  return { success: true };
}

export async function setClinicPublished(published: boolean): Promise<{ error?: string }> {
  const profile = await requireRole(["clinic_owner"]);
  const supabase = await createClient();
  const clinicId = profile.clinicId!;

  if (published) {
    const [{ count: activeServices }, { count: scheduleRules }] = await Promise.all([
      supabase.from("services").select("id", { count: "exact", head: true }).eq("clinic_id", clinicId).eq("is_active", true).is("deleted_at", null),
      supabase.from("availability_rules").select("id", { count: "exact", head: true }).eq("clinic_id", clinicId).is("deleted_at", null),
    ]);

    // Publicar una página sin servicios ni horarios deja al paciente ver una
    // página vacía sin poder reservar nada — mejor bloquearlo aquí que dejar
    // que el dueño descubra el problema cuando un paciente ya se quejó.
    if (!activeServices) {
      return { error: "Agrega al menos un servicio activo antes de publicar tu página." };
    }
    if (!scheduleRules) {
      return { error: "Configura al menos un horario de disponibilidad antes de publicar tu página." };
    }
  }

  await supabase.from("clinics").update({ is_published: published }).eq("id", clinicId);

  revalidatePath("/dashboard/configuracion/marca");
  return {};
}

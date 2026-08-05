"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/session";
import type { Database } from "@/lib/supabase/types";

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

  async function uploadImage(file: File, prefix: string): Promise<string | undefined> {
    if (!file || file.size === 0) return undefined;
    const ext = file.name.split(".").pop() || "png";
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

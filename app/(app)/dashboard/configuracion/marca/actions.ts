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

  const logoFile = formData.get("logo") as File | null;
  const primaryColor = formData.get("primary_color") as string;
  const secondaryColor = formData.get("secondary_color") as string;
  const visualTheme = formData.get("visual_theme") as Database["public"]["Enums"]["visual_theme"];

  let logoUrl: string | undefined;

  if (logoFile && logoFile.size > 0) {
    const ext = logoFile.name.split(".").pop() || "png";
    const path = `${clinicId}/logo-${Date.now()}.${ext}`;
    const { error: uploadError } = await supabase.storage.from("branding").upload(path, logoFile, {
      upsert: true,
      contentType: logoFile.type || undefined,
    });
    if (uploadError) return { error: "No pudimos subir el logo. Intenta con otra imagen." };
    logoUrl = supabase.storage.from("branding").getPublicUrl(path).data.publicUrl;
  }

  const { error } = await supabase
    .from("clinic_branding")
    .update({
      primary_color: primaryColor,
      secondary_color: secondaryColor,
      visual_theme: visualTheme,
      ...(logoUrl ? { logo_url: logoUrl } : {}),
    })
    .eq("clinic_id", clinicId);

  if (error) return { error: "No pudimos guardar los cambios." };

  revalidatePath("/dashboard/configuracion/marca");
  revalidatePath("/dashboard", "layout");
  return { success: true };
}

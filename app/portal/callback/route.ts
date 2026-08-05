import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(`${origin}/portal/login`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(`${origin}/portal/login`);
  }

  // Vincula cualquier registro de paciente sin reclamar (en cualquier
  // clínica) cuyo email coincida con el de la cuenta recién autenticada.
  await supabase.rpc("claim_patient_records");

  return NextResponse.redirect(`${origin}/portal`);
}

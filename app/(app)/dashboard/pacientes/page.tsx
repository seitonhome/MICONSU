import Link from "next/link";
import { Users, Search } from "lucide-react";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DOCUMENT_TYPE_LABELS } from "@/lib/domain/labels";
import { BADGE_ACCENT, BADGE_OUTLINE } from "@/lib/utils/badge-styles";
import { cn } from "@/lib/utils";
import { PatientDialog } from "./patient-dialog";

function initials(fullName: string): string {
  const parts = fullName.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase();
}

export default async function PacientesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const profile = await requireRole(["clinic_owner", "assistant", "receptionist", "professional"]);
  const supabase = await createClient();
  const { q } = await searchParams;

  let query = supabase
    .from("patients")
    .select("*")
    .eq("clinic_id", profile.clinicId!)
    .is("deleted_at", null)
    .order("full_name");

  if (q) {
    query = query.or(`full_name.ilike.%${q}%,document_number.ilike.%${q}%,phone.ilike.%${q}%,email.ilike.%${q}%`);
  }

  const { data: patients } = await query;
  const canManage = profile.role !== "professional";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground">Pacientes</h1>
          <p className="mt-1 text-muted-foreground">
            {patients && patients.length > 0
              ? `${patients.length} paciente${patients.length === 1 ? "" : "s"} registrado${patients.length === 1 ? "" : "s"}.`
              : "Cuando alguien reserve, aparecerá aquí automáticamente. También puedes registrarlos manualmente."}
          </p>
        </div>
        {canManage && <PatientDialog />}
      </div>

      <form className="flex max-w-sm items-center gap-2">
        <Input name="q" defaultValue={q} placeholder="Buscar por nombre, documento, teléfono o correo" />
        <Button type="submit" variant="outline" size="icon" aria-label="Buscar">
          <Search className="size-4" />
        </Button>
      </form>

      {!patients || patients.length === 0 ? (
        <div className="rounded-2xl border border-dashed p-10 text-center">
          <Users className="mx-auto size-8 text-muted-foreground" />
          <p className="mt-3 font-medium">
            {q ? "No encontramos pacientes con esa búsqueda." : "No tienes pacientes registrados."}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {q ? "Prueba con otro nombre, documento, teléfono o correo." : "Cuando alguien reserve, aparecerá aquí automáticamente."}
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-black/[0.06] overflow-hidden rounded-[16px] border border-black/[0.07] bg-card">
          {patients.map((p) => (
            <li key={p.id}>
              <Link
                href={`/dashboard/pacientes/${p.id}`}
                className="flex items-center gap-4 px-5 py-4 hover:bg-muted/40"
              >
                <Avatar>
                  <AvatarFallback className="bg-accent/[0.22] font-semibold text-accent-foreground">
                    {initials(p.full_name) || "?"}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13.5px] font-semibold text-foreground/90">{p.full_name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {p.document_number
                      ? `${DOCUMENT_TYPE_LABELS[p.document_type ?? ""] ?? p.document_type ?? "Doc."} ${p.document_number}`
                      : "Sin documento"}
                  </p>
                </div>
                <div className="hidden min-w-0 flex-1 text-right sm:block">
                  <p className="truncate text-xs text-muted-foreground">
                    {[p.phone, p.email].filter(Boolean).join(" · ") || "Sin contacto"}
                  </p>
                  {p.city && <p className="truncate text-xs text-muted-foreground">{p.city}</p>}
                </div>
                <Badge variant="outline" className={cn("shrink-0", p.status === "active" ? BADGE_ACCENT : BADGE_OUTLINE)}>
                  {p.status === "active" ? "Activo" : "Inactivo"}
                </Badge>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

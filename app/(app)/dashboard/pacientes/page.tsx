import Link from "next/link";
import { Users } from "lucide-react";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { PatientDialog } from "./patient-dialog";

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
          <h1 className="text-2xl font-semibold">Pacientes</h1>
          <p className="mt-1 text-muted-foreground">
            Cuando alguien reserve, aparecerá aquí automáticamente. También puedes registrarlos manualmente.
          </p>
        </div>
        {canManage && <PatientDialog />}
      </div>

      <form className="max-w-sm">
        <Input name="q" defaultValue={q} placeholder="Buscar por nombre, documento, teléfono o correo" />
      </form>

      {!patients || patients.length === 0 ? (
        <div className="rounded-2xl border border-dashed p-10 text-center">
          <Users className="mx-auto size-8 text-muted-foreground" />
          <p className="mt-3 font-medium">No tienes pacientes registrados.</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Cuando alguien reserve, aparecerá aquí automáticamente.
          </p>
        </div>
      ) : (
        <ul className="divide-y rounded-xl border">
          {patients.map((p) => (
            <li key={p.id}>
              <Link
                href={`/dashboard/pacientes/${p.id}`}
                className="flex items-center justify-between gap-4 px-4 py-3 hover:bg-muted/50"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{p.full_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {[p.phone, p.email].filter(Boolean).join(" · ") || "Sin contacto"}
                  </p>
                </div>
                <Badge variant={p.status === "active" ? "secondary" : "outline"}>
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

import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { MODULE_KEYS, MODULE_KEY_LABELS } from "@/lib/domain/labels";

export default async function AdminModulosPage() {
  const supabase = await createClient();

  const { data: enabledModules } = await supabase.from("enabled_modules").select("*").eq("is_active", true);

  const countByModule = new Map<string, number>();
  for (const key of MODULE_KEYS) countByModule.set(key, 0);
  for (const m of enabledModules ?? []) {
    countByModule.set(m.module_key, (countByModule.get(m.module_key) ?? 0) + 1);
  }

  const ranked = MODULE_KEYS.slice().sort((a, b) => (countByModule.get(b) ?? 0) - (countByModule.get(a) ?? 0));

  const clinicIds = Array.from(new Set((enabledModules ?? []).map((m) => m.clinic_id)));
  const { data: clinics } = clinicIds.length > 0
    ? await supabase.from("clinics").select("id, commercial_name").in("id", clinicIds)
    : { data: [] as { id: string; commercial_name: string }[] };
  const clinicById = new Map((clinics ?? []).map((c) => [c.id, c.commercial_name]));

  const modulesByClinic = new Map<string, string[]>();
  for (const m of enabledModules ?? []) {
    const list = modulesByClinic.get(m.clinic_id) ?? [];
    list.push(m.module_key);
    modulesByClinic.set(m.clinic_id, list);
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Módulos</h1>
        <p className="mt-1 text-muted-foreground">Módulos adicionales cobrables, activos en toda la plataforma.</p>
      </div>

      <div>
        <h2 className="mb-3 text-sm font-medium text-muted-foreground">Módulos más vendidos</h2>
        <ul className="divide-y rounded-xl border bg-background">
          {ranked.map((key) => (
            <li key={key} className="flex items-center justify-between px-4 py-3">
              <span className="text-sm">{MODULE_KEY_LABELS[key]}</span>
              <Badge variant="outline">{countByModule.get(key) ?? 0} consultorio(s)</Badge>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <h2 className="mb-3 text-sm font-medium text-muted-foreground">Por consultorio</h2>
        {modulesByClinic.size === 0 ? (
          <p className="text-sm text-muted-foreground">Ningún consultorio tiene módulos adicionales activos todavía.</p>
        ) : (
          <ul className="divide-y rounded-xl border bg-background">
            {Array.from(modulesByClinic.entries()).map(([clinicId, keys]) => (
              <li key={clinicId}>
                <Link href={`/admin/consultorios/${clinicId}`} className="flex items-center justify-between gap-4 px-4 py-3 hover:bg-muted/50">
                  <span className="text-sm font-medium">{clinicById.get(clinicId) ?? "Consultorio"}</span>
                  <span className="text-xs text-muted-foreground">{keys.length} módulo(s) activo(s)</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { ConfirmSubmitButton } from "@/components/patterns/confirm-submit-button";
import { Trash2 } from "lucide-react";
import { ServiceDialog } from "./service-dialog";
import { ServiceActiveToggle } from "./service-active-toggle";
import { CategoryForm } from "./category-form";
import { deleteService, deleteCategory } from "./actions";
import { SERVICE_CLASSIFICATION_LABELS, MODALITY_LABELS } from "@/lib/domain/labels";
import type { Database } from "@/lib/supabase/types";

type ServiceRow = Database["public"]["Tables"]["services"]["Row"];
type CategoryRow = Database["public"]["Tables"]["service_categories"]["Row"];

export default async function ServiciosPage() {
  const profile = await requireRole(["clinic_owner"]);
  const supabase = await createClient();

  const [{ data: categories }, { data: services }] = await Promise.all([
    supabase
      .from("service_categories")
      .select("*")
      .eq("clinic_id", profile.clinicId!)
      .is("deleted_at", null)
      .order("sort_order"),
    supabase
      .from("services")
      .select("*")
      .eq("clinic_id", profile.clinicId!)
      .is("deleted_at", null)
      .order("created_at"),
  ]);

  const cats = categories ?? [];
  const svcs = services ?? [];
  const uncategorized = svcs.filter((s) => !s.category_id);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Servicios</h1>
          <p className="mt-1 text-muted-foreground">
            Define lo que ofreces, su duración, precio y reglas de pago. Esto es lo que tus pacientes verán al reservar.
          </p>
        </div>
        <ServiceDialog categories={cats} />
      </div>

      <div className="rounded-xl border p-4">
        <CategoryForm />
        {cats.length > 0 && (
          <ul className="mt-4 flex flex-wrap gap-2">
            {cats.map((c) => (
              <li key={c.id}>
                <form action={deleteCategory.bind(null, c.id)} className="inline-flex">
                  <Badge variant="outline" className="gap-1.5 pr-1">
                    {c.name}
                    <ConfirmSubmitButton
                      confirmMessage={`¿Eliminar la categoría "${c.name}"? Los servicios no se eliminan, solo quedan sin categoría.`}
                      variant="ghost"
                      size="icon-sm"
                      className="size-4"
                    >
                      <Trash2 className="size-3" />
                    </ConfirmSubmitButton>
                  </Badge>
                </form>
              </li>
            ))}
          </ul>
        )}
      </div>

      {svcs.length === 0 ? (
        <div className="rounded-2xl border border-dashed p-10 text-center">
          <p className="font-medium">Aún no tienes servicios.</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Crea tu primer servicio para poder recibir reservas en tu página pública.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {cats.map((cat) => {
            const items = svcs.filter((s) => s.category_id === cat.id);
            if (items.length === 0) return null;
            return <ServiceGroup key={cat.id} title={cat.name} services={items} categories={cats} />;
          })}
          {uncategorized.length > 0 && (
            <ServiceGroup title="Sin categoría" services={uncategorized} categories={cats} />
          )}
        </div>
      )}
    </div>
  );
}

function ServiceGroup({
  title,
  services,
  categories,
}: {
  title: string;
  services: ServiceRow[];
  categories: CategoryRow[];
}) {
  return (
    <div>
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">{title}</h2>
      <ul className="divide-y rounded-xl border">
        {services.map((s) => (
          <li key={s.id} className="flex items-center justify-between gap-4 px-4 py-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{s.name}</p>
              <p className="text-xs text-muted-foreground">
                {s.duration_minutes} min ·{" "}
                {s.price > 0 ? `$${Number(s.price).toLocaleString("es-CO")}` : "Sin costo"} ·{" "}
                {MODALITY_LABELS[s.modality]}
              </p>
              <Badge variant="secondary" className="mt-1">
                {SERVICE_CLASSIFICATION_LABELS[s.classification]}
              </Badge>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <ServiceActiveToggle id={s.id} isActive={s.is_active} />
              <ServiceDialog service={s} categories={categories} />
              <form action={deleteService.bind(null, s.id)}>
                <ConfirmSubmitButton
                  confirmMessage={`¿Eliminar el servicio "${s.name}"?`}
                  variant="ghost"
                  size="icon"
                  aria-label="Eliminar"
                >
                  <Trash2 className="size-4" />
                </ConfirmSubmitButton>
              </form>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

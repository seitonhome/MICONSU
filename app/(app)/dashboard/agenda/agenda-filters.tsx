"use client";

import { useRouter } from "next/navigation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import type { Database } from "@/lib/supabase/types";

type Professional = Database["public"]["Tables"]["professionals"]["Row"];

export function AgendaFilters({
  date,
  professionalId,
  professionals,
}: {
  date: string;
  professionalId: string;
  professionals: Professional[];
}) {
  const router = useRouter();

  function updateParams(next: { date?: string; professional?: string }) {
    const params = new URLSearchParams();
    params.set("date", next.date ?? date);
    if (next.professional ?? professionalId) {
      params.set("professional", next.professional ?? professionalId);
    }
    router.push(`/dashboard/agenda?${params.toString()}`);
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Input
        type="date"
        value={date}
        onChange={(e) => updateParams({ date: e.target.value })}
        className="w-auto"
      />
      <Select
        value={professionalId || "all"}
        onValueChange={(value) => updateParams({ professional: value === "all" ? "" : String(value) })}
      >
        <SelectTrigger className="w-auto">
          <SelectValue placeholder="Todos los profesionales" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos los profesionales</SelectItem>
          {professionals.map((p) => (
            <SelectItem key={p.id} value={p.id}>
              {p.full_name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

"use client";

import { useTransition } from "react";
import { Switch } from "@/components/ui/switch";
import { toggleModule } from "../../actions";
import type { Database } from "@/lib/supabase/types";

export function ModuleToggle({
  clinicId,
  moduleKey,
  isActive,
}: {
  clinicId: string;
  moduleKey: Database["public"]["Enums"]["module_key"];
  isActive: boolean;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <Switch
      checked={isActive}
      disabled={isPending}
      onCheckedChange={(checked) => startTransition(() => toggleModule(clinicId, moduleKey, checked))}
    />
  );
}

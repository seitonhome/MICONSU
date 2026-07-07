"use client";

import { useTransition } from "react";
import { Switch } from "@/components/ui/switch";
import { toggleServiceActive } from "./actions";

export function ServiceActiveToggle({ id, isActive }: { id: string; isActive: boolean }) {
  const [isPending, startTransition] = useTransition();

  return (
    <Switch
      checked={isActive}
      disabled={isPending}
      onCheckedChange={(checked) => startTransition(() => toggleServiceActive(id, checked))}
    />
  );
}

"use client";

import { useTransition } from "react";
import { Switch } from "@/components/ui/switch";
import { toggleConsentActive } from "./actions";

export function ConsentActiveToggle({ id, isActive }: { id: string; isActive: boolean }) {
  const [isPending, startTransition] = useTransition();

  return (
    <Switch
      checked={isActive}
      disabled={isPending}
      onCheckedChange={(checked) => startTransition(() => toggleConsentActive(id, checked))}
    />
  );
}

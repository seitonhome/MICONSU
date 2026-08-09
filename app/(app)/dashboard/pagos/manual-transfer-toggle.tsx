"use client";

import { useTransition } from "react";
import { Switch } from "@/components/ui/switch";
import { toggleManualTransferActive } from "./actions";

export function ManualTransferToggle({ isActive }: { isActive: boolean }) {
  const [isPending, startTransition] = useTransition();

  return (
    <Switch
      checked={isActive}
      disabled={isPending}
      onCheckedChange={(checked) => startTransition(() => toggleManualTransferActive(checked))}
    />
  );
}

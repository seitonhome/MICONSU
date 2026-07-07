"use client";

import { useTransition } from "react";
import { Switch } from "@/components/ui/switch";
import { toggleInPerson } from "./actions";

export function InPersonToggle({ isActive }: { isActive: boolean }) {
  const [isPending, startTransition] = useTransition();

  return (
    <Switch
      checked={isActive}
      disabled={isPending}
      onCheckedChange={(checked) => startTransition(() => toggleInPerson(checked))}
    />
  );
}

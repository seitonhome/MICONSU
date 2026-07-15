"use client";

import { useActionState, useEffect, useState } from "react";
import { Send } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { assignResource, type ResourceActionState } from "./actions";
import type { Database } from "@/lib/supabase/types";

const initialState: ResourceActionState = {};

export function AssignDialog({
  resourceId,
  patients,
}: {
  resourceId: string;
  patients: Database["public"]["Tables"]["patients"]["Row"][];
}) {
  const [open, setOpen] = useState(false);
  const action = assignResource.bind(null, resourceId);
  const [state, formAction, isPending] = useActionState(action, initialState);

  useEffect(() => {
    if (state?.success) setOpen(false);
  }, [state]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="ghost" size="icon" aria-label="Asignar a paciente" />}>
        <Send className="size-4" />
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Asignar recurso</DialogTitle>
          <DialogDescription>El paciente lo verá en su portal.</DialogDescription>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <Select name="patient_id" defaultValue={patients[0]?.id}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {patients.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.full_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
          <div className="flex justify-end border-t pt-4">
            <Button type="submit" disabled={isPending}>
              {isPending ? "Asignando..." : "Asignar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

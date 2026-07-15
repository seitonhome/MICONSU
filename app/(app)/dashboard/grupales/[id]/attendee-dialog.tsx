"use client";

import { useActionState, useEffect, useState } from "react";
import { UserPlus } from "lucide-react";
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
import { addAttendee, type GroupSessionActionState } from "../actions";
import type { Database } from "@/lib/supabase/types";

const initialState: GroupSessionActionState = {};

export function AttendeeDialog({
  groupSessionId,
  patients,
}: {
  groupSessionId: string;
  patients: Database["public"]["Tables"]["patients"]["Row"][];
}) {
  const [open, setOpen] = useState(false);
  const action = addAttendee.bind(null, groupSessionId);
  const [state, formAction, isPending] = useActionState(action, initialState);

  useEffect(() => {
    if (state?.success) setOpen(false);
  }, [state]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" />}>
        <UserPlus className="size-4" />
        Inscribir paciente
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Inscribir paciente</DialogTitle>
          <DialogDescription>El sistema no permite pasarse del cupo máximo.</DialogDescription>
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
              {isPending ? "Inscribiendo..." : "Inscribir"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

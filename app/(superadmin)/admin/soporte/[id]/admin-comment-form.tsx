"use client";

import { useActionState, useEffect, useRef } from "react";
import { addAdminComment, type AdminActionState } from "../../actions";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

const initialState: AdminActionState = {};

export function AdminCommentForm({ ticketId }: { ticketId: string }) {
  const action = addAdminComment.bind(null, ticketId);
  const [state, formAction, isPending] = useActionState(action, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.success) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="space-y-2">
      <Textarea name="body" placeholder="Escribe un mensaje..." rows={3} required />
      <label className="flex items-center gap-2 text-sm">
        <Checkbox name="is_internal" />
        Nota interna (el consultorio no la ve)
      </label>
      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
      <Button type="submit" size="sm" disabled={isPending}>
        {isPending ? "Enviando..." : "Enviar"}
      </Button>
    </form>
  );
}

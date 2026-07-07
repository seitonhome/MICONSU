"use client";

import { useActionState, useEffect, useRef } from "react";
import { addTicketComment, type SupportActionState } from "../actions";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

const initialState: SupportActionState = {};

export function CommentForm({ ticketId }: { ticketId: string }) {
  const action = addTicketComment.bind(null, ticketId);
  const [state, formAction, isPending] = useActionState(action, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.success) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="space-y-2">
      <Textarea name="body" placeholder="Escribe un mensaje..." rows={3} required />
      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
      <Button type="submit" size="sm" disabled={isPending}>
        {isPending ? "Enviando..." : "Enviar mensaje"}
      </Button>
    </form>
  );
}

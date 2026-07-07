"use client";

import { useActionState } from "react";
import { cancelPublicAppointment, type ManageBookingState } from "./actions";
import { Button } from "@/components/ui/button";

const initialState: ManageBookingState = {};

export function CancelBookingForm({ token }: { token: string }) {
  const [state, formAction, isPending] = useActionState(cancelPublicAppointment.bind(null, token), initialState);

  if (state?.success) {
    return <p className="text-center text-sm text-primary">Tu cita fue cancelada.</p>;
  }

  return (
    <form
      action={formAction}
      onSubmit={(e) => {
        if (!window.confirm("¿Seguro que quieres cancelar esta cita?")) e.preventDefault();
      }}
    >
      {state?.error && <p className="mb-2 text-sm text-destructive">{state.error}</p>}
      <Button type="submit" variant="outline" className="w-full" disabled={isPending}>
        {isPending ? "Cancelando..." : "Cancelar mi cita"}
      </Button>
    </form>
  );
}

"use client";

import { useActionState, useEffect, useRef } from "react";
import { createCategory, type ServiceActionState } from "./actions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const initialState: ServiceActionState = {};

export function CategoryForm() {
  const [state, formAction, isPending] = useActionState(createCategory, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.success) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="flex items-end gap-2">
      <div className="flex-1 space-y-1">
        <label htmlFor="category_name" className="text-xs text-muted-foreground">
          Nueva categoría
        </label>
        <Input id="category_name" name="name" placeholder="Ej. Terapias individuales" />
      </div>
      <Button type="submit" variant="outline" disabled={isPending}>
        Agregar
      </Button>
      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
    </form>
  );
}

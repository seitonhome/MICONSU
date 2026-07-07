"use client";

import { useState, useTransition } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { updatePatientNotes } from "../actions";

export function NotesForm({ patientId, initialNotes }: { patientId: string; initialNotes: string }) {
  const [notes, setNotes] = useState(initialNotes);
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  return (
    <div className="space-y-2">
      <Textarea
        value={notes}
        onChange={(e) => {
          setNotes(e.target.value);
          setSaved(false);
        }}
        rows={4}
        placeholder="Notas administrativas visibles para el equipo (no clínicas)."
      />
      <div className="flex items-center gap-3">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={isPending}
          onClick={() =>
            startTransition(async () => {
              await updatePatientNotes(patientId, notes);
              setSaved(true);
            })
          }
        >
          {isPending ? "Guardando..." : "Guardar notas"}
        </Button>
        {saved && <span className="text-xs text-muted-foreground">Guardado.</span>}
      </div>
    </div>
  );
}

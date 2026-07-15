"use client";

import { useState, useTransition } from "react";
import { NotebookPen } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { addProgressNote } from "./actions";

export function ProcessNoteDialog({ id }: { id: string }) {
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState("");
  const [nextSessionAt, setNextSessionAt] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleSubmit() {
    if (!note.trim()) return;
    startTransition(async () => {
      await addProgressNote(id, note.trim(), nextSessionAt || null);
      setNote("");
      setNextSessionAt("");
      setOpen(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="ghost" size="icon" aria-label="Agregar avance" />}>
        <NotebookPen className="size-4" />
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Registrar avance</DialogTitle>
          <DialogDescription>Se agrega al historial del proceso con fecha y hora.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="note">Notas de evolución</Label>
            <Textarea id="note" rows={4} value={note} onChange={(e) => setNote(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="next_session_at">Próxima sesión sugerida (opcional)</Label>
            <Input
              id="next_session_at"
              type="datetime-local"
              value={nextSessionAt}
              onChange={(e) => setNextSessionAt(e.target.value)}
            />
          </div>
          <div className="flex justify-end border-t pt-4">
            <Button onClick={handleSubmit} disabled={isPending || !note.trim()}>
              {isPending ? "Guardando..." : "Guardar avance"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

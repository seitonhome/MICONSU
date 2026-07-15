"use client";

import { useActionState, useEffect, useState } from "react";
import { Plus } from "lucide-react";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { uploadResource, type ResourceActionState } from "./actions";

const initialState: ResourceActionState = {};

const RESOURCE_TYPES = [
  { value: "pdf", label: "PDF" },
  { value: "audio", label: "Audio" },
  { value: "video", label: "Video" },
  { value: "guide", label: "Guía" },
  { value: "exercise", label: "Ejercicio" },
  { value: "other", label: "Otro" },
];

export function ResourceDialog() {
  const [open, setOpen] = useState(false);
  const [state, formAction, isPending] = useActionState(uploadResource, initialState);

  useEffect(() => {
    if (state?.success) setOpen(false);
  }, [state]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>
        <Plus className="size-4" />
        Subir recurso
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Subir recurso</DialogTitle>
          <DialogDescription>PDFs, audios, videos o guías que puedas enviar a tus pacientes.</DialogDescription>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Título</Label>
            <Input id="title" name="title" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Descripción (opcional)</Label>
            <Textarea id="description" name="description" rows={2} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="resource_type">Tipo</Label>
            <Select name="resource_type" defaultValue="pdf">
              <SelectTrigger id="resource_type" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {RESOURCE_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="file">Archivo</Label>
            <Input id="file" name="file" type="file" required />
          </div>
          {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
          <div className="flex justify-end border-t pt-4">
            <Button type="submit" disabled={isPending}>
              {isPending ? "Subiendo..." : "Subir recurso"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

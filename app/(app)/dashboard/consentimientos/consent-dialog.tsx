"use client";

import { useActionState, useEffect, useState } from "react";
import { Plus, Pencil } from "lucide-react";
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
import { createConsentDocument, updateConsentDocument, type ConsentActionState } from "./actions";
import { CONSENT_TEMPLATES } from "@/lib/templates/consent-templates";
import type { Database } from "@/lib/supabase/types";

const initialState: ConsentActionState = {};

type ConsentRow = Database["public"]["Tables"]["consent_documents"]["Row"];
type ConsentType = Database["public"]["Enums"]["consent_document_type"];

export function ConsentDialog({
  document,
  services,
}: {
  document?: ConsentRow;
  services: { id: string; name: string }[];
}) {
  const [open, setOpen] = useState(false);
  const action = document ? updateConsentDocument.bind(null, document.id) : createConsentDocument;
  const [state, formAction, isPending] = useActionState(action, initialState);
  const [documentType, setDocumentType] = useState<ConsentType>(document?.document_type ?? "informed_consent_general");
  const [title, setTitle] = useState(document?.title ?? CONSENT_TEMPLATES[documentType].title);
  const [body, setBody] = useState(document?.body ?? CONSENT_TEMPLATES[documentType].body);

  useEffect(() => {
    if (state?.success) setOpen(false);
  }, [state]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          document ? (
            <Button variant="ghost" size="icon" aria-label="Editar" />
          ) : (
            <Button>
              <Plus className="size-4" />
              Nuevo documento
            </Button>
          )
        }
      >
        {document && <Pencil className="size-4" />}
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{document ? "Editar documento" : "Nuevo documento"}</DialogTitle>
          <DialogDescription>
            {document
              ? "Editar el texto crea una nueva versión; las aceptaciones anteriores quedan registradas con su versión original."
              : "Elige un tipo para partir de un texto sugerido y ajústalo a tu consultorio."}
          </DialogDescription>
        </DialogHeader>

        <form action={formAction} className="space-y-4">
          {!document && (
            <div className="space-y-2">
              <Label htmlFor="document_type">Tipo de documento</Label>
              <Select
                name="document_type"
                defaultValue={documentType}
                onValueChange={(value) => {
                  const type = value as ConsentType;
                  setDocumentType(type);
                  setTitle(CONSENT_TEMPLATES[type].title);
                  setBody(CONSENT_TEMPLATES[type].body);
                }}
              >
                <SelectTrigger id="document_type" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(CONSENT_TEMPLATES) as ConsentType[]).map((type) => (
                    <SelectItem key={type} value={type}>
                      {CONSENT_TEMPLATES[type].title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="title">Título</Label>
            <Input id="title" name="title" value={title} onChange={(e) => setTitle(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="body">Texto</Label>
            <Textarea id="body" name="body" value={body} onChange={(e) => setBody(e.target.value)} rows={8} required />
          </div>

          {!document && services.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="service_id">Aplica solo a un servicio (opcional)</Label>
              <Select name="service_id">
                <SelectTrigger id="service_id" className="w-full">
                  <SelectValue placeholder="Todos los servicios" />
                </SelectTrigger>
                <SelectContent>
                  {services.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {state?.error && <p className="text-sm text-destructive">{state.error}</p>}

          <div className="flex justify-end gap-2 border-t pt-4">
            <Button type="submit" disabled={isPending}>
              {isPending ? "Guardando..." : document ? "Guardar (nueva versión)" : "Crear documento"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

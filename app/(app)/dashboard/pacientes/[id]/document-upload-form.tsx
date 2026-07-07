"use client";

import { useActionState, useRef } from "react";
import { uploadPatientDocument, deletePatientDocument, type PatientActionState } from "../actions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Trash2, FileText } from "lucide-react";

const initialState: PatientActionState = {};

export function DocumentUploadForm({
  patientId,
  documents,
}: {
  patientId: string;
  documents: { id: string; file_name: string; signedUrl: string | null; created_at: string }[];
}) {
  const action = uploadPatientDocument.bind(null, patientId);
  const [state, formAction, isPending] = useActionState(action, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <div className="space-y-4">
      {documents.length > 0 && (
        <ul className="divide-y rounded-xl border">
          {documents.map((doc) => (
            <li key={doc.id} className="flex items-center justify-between gap-4 px-4 py-3">
              <a
                href={doc.signedUrl ?? "#"}
                target="_blank"
                className="flex min-w-0 items-center gap-2 text-sm hover:underline"
              >
                <FileText className="size-4 shrink-0 text-muted-foreground" />
                <span className="truncate">{doc.file_name}</span>
              </a>
              <form action={deletePatientDocument.bind(null, patientId, doc.id)}>
                <Button type="submit" variant="ghost" size="icon" aria-label="Eliminar">
                  <Trash2 className="size-4" />
                </Button>
              </form>
            </li>
          ))}
        </ul>
      )}

      <form
        ref={formRef}
        action={async (formData) => {
          await formAction(formData);
          formRef.current?.reset();
        }}
        className="flex items-end gap-2"
      >
        <div className="flex-1 space-y-1">
          <label htmlFor="file" className="text-xs text-muted-foreground">
            Subir documento
          </label>
          <Input id="file" name="file" type="file" required />
        </div>
        <Button type="submit" variant="outline" disabled={isPending}>
          {isPending ? "Subiendo..." : "Subir"}
        </Button>
      </form>
      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
    </div>
  );
}

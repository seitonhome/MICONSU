"use client";

import { useActionState, useState } from "react";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { submitPublicReview, type ReviewSubmitState } from "./actions";
import { cn } from "@/lib/utils";

const initialState: ReviewSubmitState = {};

export function ReviewForm({
  clinicSlug,
  patientId,
  professionals,
}: {
  clinicSlug: string;
  patientId: string | null;
  professionals: { id: string; full_name: string }[];
}) {
  const action = submitPublicReview.bind(null, clinicSlug);
  const [state, formAction, isPending] = useActionState(action, initialState);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);

  if (state?.success) {
    return (
      <div className="rounded-2xl border border-dashed p-10 text-center">
        <Star className="mx-auto size-8 fill-amber-400 text-amber-400" />
        <p className="mt-3 font-medium">¡Gracias por tu reseña!</p>
        <p className="mt-1 text-sm text-muted-foreground">La revisaremos antes de publicarla.</p>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="patient_id" value={patientId ?? ""} />
      <input type="hidden" name="rating" value={rating} />

      <div className="space-y-2 text-center">
        <p className="text-sm font-medium">¿Cómo calificarías tu experiencia?</p>
        <div className="flex justify-center gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              aria-label={`${n} estrellas`}
              onClick={() => setRating(n)}
              onMouseEnter={() => setHoverRating(n)}
              onMouseLeave={() => setHoverRating(0)}
              className="p-1"
            >
              <Star
                className={cn(
                  "size-8 transition-colors",
                  (hoverRating || rating) >= n ? "fill-amber-400 text-amber-400" : "text-muted-foreground",
                )}
              />
            </button>
          ))}
        </div>
      </div>

      {professionals.length > 0 && (
        <div className="space-y-2">
          <label className="text-sm text-muted-foreground">¿Quién te atendió? (opcional)</label>
          <Select name="professional_id">
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Sin especificar">
                {(value: string) => professionals.find((p) => p.id === value)?.full_name ?? value}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {professionals.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.full_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="space-y-2">
        <label htmlFor="comment" className="text-sm text-muted-foreground">
          Cuéntanos más (opcional)
        </label>
        <Textarea id="comment" name="comment" rows={4} placeholder="¿Qué fue lo que más te gustó?" />
      </div>

      {state?.error && <p className="text-center text-sm text-destructive">{state.error}</p>}

      <Button type="submit" className="w-full" disabled={isPending || rating === 0}>
        {isPending ? "Enviando..." : "Enviar reseña"}
      </Button>
    </form>
  );
}

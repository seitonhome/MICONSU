import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export type PublicReview = {
  id: string;
  rating: number;
  comment: string | null;
  status: "approved" | "featured";
  patientFirstName: string | null;
  professionalName: string | null;
};

export function ReviewList({ reviews }: { reviews: PublicReview[] }) {
  if (reviews.length === 0) return null;

  return (
    <section>
      <h2 className="mb-4 text-lg font-semibold">Lo que dicen nuestros pacientes</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        {reviews.map((r) => (
          <div
            key={r.id}
            className={cn("rounded-xl border p-4", r.status === "featured" && "border-primary/40 bg-primary/5")}
          >
            <div className="flex items-center gap-0.5" aria-label={`${r.rating} de 5 estrellas`}>
              {[1, 2, 3, 4, 5].map((n) => (
                <Star
                  key={n}
                  className={cn("size-3.5", n <= r.rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30")}
                />
              ))}
            </div>
            {r.comment && <p className="mt-2 text-sm text-muted-foreground">&ldquo;{r.comment}&rdquo;</p>}
            <p className="mt-2 text-xs font-medium">
              {r.patientFirstName ?? "Paciente"}
              {r.professionalName ? ` · ${r.professionalName}` : ""}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

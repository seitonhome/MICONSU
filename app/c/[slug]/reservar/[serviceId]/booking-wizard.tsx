"use client";

import { useActionState, useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import { fetchSlotsAction, createBookingAction, type BookingActionState } from "./actions";
import { PRACTITIONER_TYPE_LABELS } from "@/lib/auth/roles";
import type { Database } from "@/lib/supabase/types";

type Service = Database["public"]["Tables"]["services"]["Row"];
type Professional = Database["public"]["Tables"]["professionals"]["Row"];
type Location = Database["public"]["Tables"]["clinic_locations"]["Row"];
type ConsentDoc = Database["public"]["Tables"]["consent_documents"]["Row"];
type PaymentProvider = Database["public"]["Views"]["payment_providers_public"]["Row"];

const initialState: BookingActionState = {};

function toDateInputValue(d: Date) {
  return d.toISOString().slice(0, 10);
}

export function BookingWizard({
  clinicSlug,
  clinicId,
  service,
  professionals,
  locations,
  consentDocuments,
  paymentProviders,
  manualTransferInstructions,
  preselectedProfessionalId,
}: {
  clinicSlug: string;
  clinicId: string;
  service: Service;
  professionals: Professional[];
  locations: Location[];
  consentDocuments: ConsentDoc[];
  paymentProviders: PaymentProvider[];
  manualTransferInstructions: string | null;
  preselectedProfessionalId?: string;
}) {
  const router = useRouter();
  const needsProfessionalStep = professionals.length > 1;
  const [step, setStep] = useState(needsProfessionalStep ? 0 : 1);

  const [professionalId, setProfessionalId] = useState(
    preselectedProfessionalId ?? professionals[0]?.id ?? "",
  );
  const [modality, setModality] = useState<"in_person" | "virtual">(
    service.modality === "virtual" ? "virtual" : "in_person",
  );
  const [locationId, setLocationId] = useState(locations[0]?.id ?? "");
  const [date, setDate] = useState<Date>(new Date());
  const [time, setTime] = useState("");
  const [slots, setSlots] = useState<string[]>([]);
  const [loadingSlots, startSlotsTransition] = useTransition();

  const [fullName, setFullName] = useState("");
  const [documentNumber, setDocumentNumber] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  const [acceptedDocs, setAcceptedDocs] = useState<string[]>([]);
  const [paymentProviderKey, setPaymentProviderKey] = useState(paymentProviders[0]?.provider_key ?? "");

  const [state, formAction, isPending] = useActionState(createBookingAction, initialState);

  useEffect(() => {
    if (state?.token) router.push(`/reserva/${state.token}`);
  }, [state, router]);

  useEffect(() => {
    if (!professionalId) return;
    startSlotsTransition(async () => {
      const result = await fetchSlotsAction({
        clinicId,
        professionalId,
        durationMinutes: service.duration_minutes,
        date: toDateInputValue(date),
        minAdvanceHours: service.min_advance_hours,
      });
      setSlots(result);
      setTime((prev) => (result.includes(prev) ? prev : ""));
    });
  }, [professionalId, date, clinicId, service.duration_minutes, service.min_advance_hours]);

  const allDocsAccepted = useMemo(
    () => consentDocuments.every((d) => acceptedDocs.includes(d.id)),
    [consentDocuments, acceptedDocs],
  );

  const steps = [
    needsProfessionalStep ? "professional" : null,
    "datetime",
    "data",
    consentDocuments.length > 0 ? "consent" : null,
    service.requires_payment ? "payment" : null,
    "review",
  ].filter(Boolean) as string[];

  const currentKey = steps[step] ?? steps[0];

  function goNext() {
    setStep((s) => Math.min(s + 1, steps.length - 1));
  }
  function goBack() {
    setStep((s) => Math.max(s - 1, 0));
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border bg-muted/30 p-4">
        <p className="text-sm text-muted-foreground">Estás reservando</p>
        <p className="font-medium">{service.name}</p>
        <p className="text-xs text-muted-foreground">{service.duration_minutes} min</p>
      </div>

      {currentKey === "professional" && (
        <div className="space-y-4">
          <h2 className="font-medium">Elige quién te va a atender</h2>
          <div className="grid gap-3">
            {professionals.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  setProfessionalId(p.id);
                  goNext();
                }}
                className="rounded-xl border p-4 text-left transition-colors hover:border-primary"
              >
                <p className="font-medium">{p.full_name}</p>
                <p className="text-sm text-muted-foreground">
                  {p.specialty_label || PRACTITIONER_TYPE_LABELS[p.practitioner_type]}
                </p>
              </button>
            ))}
          </div>
        </div>
      )}

      {currentKey === "datetime" && (
        <div className="space-y-4">
          <h2 className="font-medium">Elige fecha y hora</h2>
          {(service.modality === "both" || locations.length > 0) && (
            <div className="flex gap-2">
              {service.modality !== "virtual" && (
                <Button type="button" size="sm" variant={modality === "in_person" ? "default" : "outline"} onClick={() => setModality("in_person")}>
                  Presencial
                </Button>
              )}
              {service.modality !== "in_person" && (
                <Button type="button" size="sm" variant={modality === "virtual" ? "default" : "outline"} onClick={() => setModality("virtual")}>
                  Virtual
                </Button>
              )}
            </div>
          )}
          {modality === "in_person" && locations.length > 1 && (
            <div className="flex flex-wrap gap-2">
              {locations.map((l) => (
                <Button
                  key={l.id}
                  type="button"
                  size="sm"
                  variant={locationId === l.id ? "default" : "outline"}
                  onClick={() => setLocationId(l.id)}
                >
                  {l.name}
                </Button>
              ))}
            </div>
          )}
          <Calendar
            mode="single"
            selected={date}
            onSelect={(d) => d && setDate(d)}
            disabled={{ before: new Date() }}
            className="rounded-xl border"
          />
          <div>
            {loadingSlots ? (
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" /> Buscando horarios disponibles...
              </p>
            ) : slots.length === 0 ? (
              <p className="text-sm text-muted-foreground">No hay horarios disponibles ese día. Prueba otra fecha.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {slots.map((s) => (
                  <Button key={s} type="button" size="sm" variant={time === s ? "default" : "outline"} onClick={() => setTime(s)}>
                    {s}
                  </Button>
                ))}
              </div>
            )}
          </div>
          <div className="flex justify-between border-t pt-4">
            {needsProfessionalStep && (
              <Button type="button" variant="outline" onClick={goBack}>
                <ChevronLeft className="size-4" /> Atrás
              </Button>
            )}
            <Button type="button" disabled={!time} onClick={goNext} className="ml-auto">
              Continuar <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      )}

      {currentKey === "data" && (
        <div className="space-y-4">
          <h2 className="font-medium">Tus datos</h2>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="full_name">Nombre completo</Label>
              <Input id="full_name" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="document_number">Documento (opcional)</Label>
              <Input id="document_number" value={documentNumber} onChange={(e) => setDocumentNumber(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Correo electrónico</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Teléfono</Label>
              <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} required />
            </div>
          </div>
          <div className="flex justify-between border-t pt-4">
            <Button type="button" variant="outline" onClick={goBack}>
              <ChevronLeft className="size-4" /> Atrás
            </Button>
            <Button type="button" disabled={!fullName || !phone} onClick={goNext}>
              Continuar <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      )}

      {currentKey === "consent" && (
        <div className="space-y-4">
          <h2 className="font-medium">Antes de confirmar</h2>
          <ul className="space-y-3">
            {consentDocuments.map((doc) => (
              <li key={doc.id} className="rounded-xl border p-3">
                <label className="flex items-start gap-2 text-sm">
                  <Checkbox
                    checked={acceptedDocs.includes(doc.id)}
                    onCheckedChange={(checked) =>
                      setAcceptedDocs((prev) => (checked ? [...prev, doc.id] : prev.filter((id) => id !== doc.id)))
                    }
                  />
                  <span>
                    <span className="font-medium">{doc.title}</span>
                    <p className="mt-1 text-xs text-muted-foreground">{doc.body}</p>
                  </span>
                </label>
              </li>
            ))}
          </ul>
          <div className="flex justify-between border-t pt-4">
            <Button type="button" variant="outline" onClick={goBack}>
              <ChevronLeft className="size-4" /> Atrás
            </Button>
            <Button type="button" disabled={!allDocsAccepted} onClick={goNext}>
              Continuar <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      )}

      {currentKey === "payment" && (
        <div className="space-y-4">
          <h2 className="font-medium">Cómo quieres pagar</h2>
          {paymentProviders.length === 0 ? (
            <p className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
              El consultorio coordinará contigo el pago de este servicio después de confirmar tu reserva.
            </p>
          ) : (
            <div className="space-y-2">
              {paymentProviders.map((p) => (
                <label key={p.id} className="flex items-center gap-2 rounded-xl border p-3 text-sm">
                  <input
                    type="radio"
                    name="payment_choice"
                    checked={paymentProviderKey === p.provider_key}
                    onChange={() => setPaymentProviderKey(p.provider_key)}
                  />
                  {p.display_name}
                </label>
              ))}
              {paymentProviderKey === "manual_transfer" && manualTransferInstructions && (
                <p className="rounded-xl bg-muted/30 p-3 text-xs text-muted-foreground">{manualTransferInstructions}</p>
              )}
            </div>
          )}
          <div className="flex justify-between border-t pt-4">
            <Button type="button" variant="outline" onClick={goBack}>
              <ChevronLeft className="size-4" /> Atrás
            </Button>
            <Button type="button" onClick={goNext}>
              Continuar <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      )}

      {currentKey === "review" && (
        <form action={formAction} className="space-y-4">
          <h2 className="font-medium">Confirma tu reserva</h2>
          <div className="space-y-1 rounded-xl border p-4 text-sm">
            <p><span className="text-muted-foreground">Servicio:</span> {service.name}</p>
            <p><span className="text-muted-foreground">Fecha:</span> {toDateInputValue(date)} a las {time}</p>
            <p><span className="text-muted-foreground">Modalidad:</span> {modality === "virtual" ? "Virtual" : "Presencial"}</p>
            <p><span className="text-muted-foreground">Nombre:</span> {fullName}</p>
            {service.requires_payment && service.price > 0 && (
              <p><span className="text-muted-foreground">Valor:</span> ${Number(service.price).toLocaleString("es-CO")}</p>
            )}
          </div>

          <input type="hidden" name="clinic_slug" value={clinicSlug} />
          <input type="hidden" name="service_id" value={service.id} />
          <input type="hidden" name="professional_id" value={professionalId} />
          <input type="hidden" name="location_id" value={locationId} />
          <input type="hidden" name="date" value={toDateInputValue(date)} />
          <input type="hidden" name="time" value={time} />
          <input type="hidden" name="modality" value={modality} />
          <input type="hidden" name="full_name" value={fullName} />
          <input type="hidden" name="document_number" value={documentNumber} />
          <input type="hidden" name="email" value={email} />
          <input type="hidden" name="phone" value={phone} />
          <input type="hidden" name="payment_provider_key" value={paymentProviderKey} />
          {acceptedDocs.map((id) => (
            <input key={id} type="hidden" name="accepted_document_ids" value={id} />
          ))}

          {state?.error && <p className="text-sm text-destructive">{state.error}</p>}

          <div className="flex justify-between border-t pt-4">
            <Button type="button" variant="outline" onClick={goBack}>
              <ChevronLeft className="size-4" /> Atrás
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Confirmando..." : "Confirmar reserva"}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}

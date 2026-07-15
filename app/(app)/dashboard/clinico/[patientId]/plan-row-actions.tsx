"use client";

import { useState, useTransition } from "react";
import { CheckCheck, DollarSign, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { registerPlanPayment, updateTreatmentPlanStatus } from "./actions";

export function PlanRowActions({
  patientId,
  planId,
  status,
}: {
  patientId: string;
  planId: string;
  status: "active" | "completed" | "cancelled";
}) {
  const [amount, setAmount] = useState("");
  const [isPending, startTransition] = useTransition();

  if (status !== "active") return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Input
        type="number"
        min={0}
        step="1000"
        placeholder="Abono"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        className="h-8 w-28"
      />
      <Button
        variant="outline"
        size="sm"
        disabled={isPending || !Number(amount)}
        onClick={() =>
          startTransition(async () => {
            await registerPlanPayment(patientId, planId, Number(amount));
            setAmount("");
          })
        }
      >
        <DollarSign className="size-4" />
        Registrar abono
      </Button>
      <Button
        variant="ghost"
        size="icon"
        aria-label="Marcar completado"
        disabled={isPending}
        onClick={() => startTransition(() => updateTreatmentPlanStatus(patientId, planId, "completed"))}
      >
        <CheckCheck className="size-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        aria-label="Cancelar plan"
        disabled={isPending}
        onClick={() => startTransition(() => updateTreatmentPlanStatus(patientId, planId, "cancelled"))}
      >
        <XCircle className="size-4" />
      </Button>
    </div>
  );
}

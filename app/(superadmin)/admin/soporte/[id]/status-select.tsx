"use client";

import { useTransition } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { updateTicketStatus } from "../../actions";
import { SUPPORT_TICKET_STATUS_LABELS } from "@/lib/domain/labels";
import type { Database } from "@/lib/supabase/types";

type Status = Database["public"]["Enums"]["support_ticket_status"];

export function StatusSelect({ ticketId, status }: { ticketId: string; status: Status }) {
  const [isPending, startTransition] = useTransition();

  return (
    <Select
      value={status}
      disabled={isPending}
      onValueChange={(value) => startTransition(() => updateTicketStatus(ticketId, value as Status))}
    >
      <SelectTrigger className="w-fit">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {Object.entries(SUPPORT_TICKET_STATUS_LABELS).map(([value, label]) => (
          <SelectItem key={value} value={value}>
            {label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

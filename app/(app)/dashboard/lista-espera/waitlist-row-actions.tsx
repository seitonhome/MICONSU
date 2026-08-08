"use client";

import { useState, useTransition } from "react";
import { Bell, CalendarPlus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { notifyWaitlistEntry, deleteWaitlistEntry } from "./actions";
import { BookWaitlistDialog } from "./book-waitlist-dialog";
import type { Database } from "@/lib/supabase/types";

type Professional = Database["public"]["Tables"]["professionals"]["Row"];
type Service = Database["public"]["Tables"]["services"]["Row"];

export function WaitlistRowActions({
  id,
  patientName,
  preferredProfessionalId,
  preferredServiceId,
  professionals,
  services,
}: {
  id: string;
  patientName: string;
  preferredProfessionalId: string | null;
  preferredServiceId: string | null;
  professionals: Professional[];
  services: Service[];
}) {
  const [isPending, startTransition] = useTransition();
  const [bookOpen, setBookOpen] = useState(false);
  const [notifyError, setNotifyError] = useState<string | null>(null);

  function handleNotify() {
    setNotifyError(null);
    startTransition(async () => {
      const result = await notifyWaitlistEntry(id);
      if (result.error) setNotifyError(result.error);
    });
  }

  return (
    <div className="flex shrink-0 flex-col items-end gap-1">
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon" aria-label="Avisar por correo" disabled={isPending} onClick={handleNotify}>
          <Bell className="size-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Crear cita"
          disabled={isPending || professionals.length === 0 || services.length === 0}
          onClick={() => setBookOpen(true)}
        >
          <CalendarPlus className="size-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Eliminar"
          disabled={isPending}
          onClick={() => startTransition(() => deleteWaitlistEntry(id))}
        >
          <Trash2 className="size-4" />
        </Button>
      </div>
      {notifyError && <p className="text-xs text-destructive">{notifyError}</p>}
      <BookWaitlistDialog
        id={id}
        patientName={patientName}
        preferredProfessionalId={preferredProfessionalId}
        preferredServiceId={preferredServiceId}
        professionals={professionals}
        services={services}
        open={bookOpen}
        onOpenChange={setBookOpen}
      />
    </div>
  );
}

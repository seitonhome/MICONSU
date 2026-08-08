import { ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";

type AccessLogEntry = {
  id: string;
  createdAt: string;
  action: "view" | "edit";
  viewerName: string;
  noteDate: string | null;
};

export function AccessLogList({ logs }: { logs: AccessLogEntry[] }) {
  if (logs.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed p-10 text-center">
        <ShieldCheck className="mx-auto size-8 text-muted-foreground" />
        <p className="mt-3 font-medium">Sin accesos registrados todavía.</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Cada vez que alguien del equipo abra las notas clínicas de este paciente, quedará registrado aquí.
        </p>
      </div>
    );
  }

  return (
    <ul className="divide-y rounded-xl border">
      {logs.map((l) => (
        <li key={l.id} className="flex items-center justify-between gap-4 px-4 py-3 text-sm">
          <div>
            <p className="font-medium">{l.viewerName}</p>
            <p className="text-xs text-muted-foreground">
              {l.noteDate ? `Nota del ${new Date(l.noteDate).toLocaleDateString("es-CO")}` : "Nota"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline">{l.action === "edit" ? "Editó" : "Vio"}</Badge>
            <span className="text-xs text-muted-foreground">
              {new Date(l.createdAt).toLocaleString("es-CO", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
            </span>
          </div>
        </li>
      ))}
    </ul>
  );
}

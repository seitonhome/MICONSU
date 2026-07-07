"use client";

import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

export function ExportCsvButton({ filename, rows }: { filename: string; rows: (string | number)[][] }) {
  function handleExport() {
    const csv = rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <Button type="button" variant="outline" size="sm" onClick={handleExport}>
      <Download className="size-4" />
      Exportar CSV
    </Button>
  );
}

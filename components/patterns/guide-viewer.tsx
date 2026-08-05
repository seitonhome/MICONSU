"use client";

import { useState } from "react";
import { Download, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

const GUIDES = {
  es: { label: "Español", file: "/guia/guia-es.pdf" },
  en: { label: "English", file: "/guia/guide-en.pdf" },
} as const;

type Lang = keyof typeof GUIDES;

export function GuideViewer() {
  const [lang, setLang] = useState<Lang>("es");
  const guide = GUIDES[lang];

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1 rounded-lg border p-1">
          {(Object.keys(GUIDES) as Lang[]).map((key) => (
            <button
              key={key}
              onClick={() => setLang(key)}
              className={`rounded-md px-3 py-1 text-sm font-medium transition-colors ${
                lang === key ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
              }`}
            >
              {GUIDES[key].label}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" render={<a href={guide.file} target="_blank" rel="noreferrer" />}>
            <ExternalLink className="size-4" /> Abrir en pestaña nueva
          </Button>
          <Button variant="outline" size="sm" render={<a href={guide.file} download />}>
            <Download className="size-4" /> Descargar PDF
          </Button>
        </div>
      </div>
      <div className="overflow-hidden rounded-xl border bg-muted/20">
        <iframe key={guide.file} src={guide.file} title="Guía de usuario" className="h-[75vh] w-full" />
      </div>
    </div>
  );
}

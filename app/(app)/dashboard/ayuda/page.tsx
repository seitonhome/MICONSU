import { Lightbulb, BookOpen, MessageCircle } from "lucide-react";
import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { GuideViewer } from "@/components/patterns/guide-viewer";
import { TIP_CATEGORIES } from "@/lib/content/tips";

export default function AyudaPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-foreground">Ayuda</h1>
        <p className="mt-1 text-muted-foreground">Tips prácticos y la guía de usuario completa, sin salir de tu panel.</p>
      </div>

      <Tabs defaultValue="tips">
        <TabsList>
          <TabsTrigger value="tips">
            <Lightbulb className="size-4" /> Tips
          </TabsTrigger>
          <TabsTrigger value="guia">
            <BookOpen className="size-4" /> Guía de usuario
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tips" className="mt-4 space-y-8">
          {TIP_CATEGORIES.map((category) => (
            <div key={category.key}>
              <h2 className="mb-1 text-sm font-semibold tracking-wide text-muted-foreground uppercase">
                {category.label}
              </h2>
              <Accordion>
                {category.tips.map((tip, i) => (
                  <AccordionItem key={i} value={`${category.key}-${i}`}>
                    <AccordionTrigger>{tip.title}</AccordionTrigger>
                    <AccordionContent>
                      <p className="text-muted-foreground">{tip.body}</p>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          ))}

          <div className="flex items-center gap-3 rounded-[16px] border border-black/[0.07] bg-secondary/40 p-4">
            <MessageCircle className="size-5 shrink-0 text-primary" />
            <div className="min-w-0 flex-1 text-sm">
              <p className="font-semibold text-foreground/90">¿No encontraste lo que buscabas?</p>
              <p className="text-muted-foreground">Escríbenos desde Soporte — el tiempo de primera respuesta depende de la prioridad del ticket.</p>
            </div>
            <Button size="sm" variant="outline" render={<Link href="/dashboard/soporte" />}>
              Ir a Soporte
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="guia" className="mt-4">
          <GuideViewer />
        </TabsContent>
      </Tabs>
    </div>
  );
}

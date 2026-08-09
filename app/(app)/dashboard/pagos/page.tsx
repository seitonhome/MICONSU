import Link from "next/link";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { Card, CardHeader, CardTitle, CardDescription, CardAction, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BADGE_ACCENT, BADGE_PRIMARY, BADGE_OUTLINE } from "@/lib/utils/badge-styles";
import { cn } from "@/lib/utils";
import { ManualTransferForm } from "./manual-transfer-form";
import { ManualTransferToggle } from "./manual-transfer-toggle";
import { WompiForm } from "./wompi-form";
import { InPersonToggle } from "./in-person-toggle";
import { MercadoPagoForm } from "./mercado-pago-form";
import { EpaycoForm } from "./epayco-form";
import { ExternalLinkForm } from "./external-link-form";

function ProviderStatusBadge({ isActive, isConfigured }: { isActive: boolean; isConfigured: boolean }) {
  if (isActive) return <Badge variant="outline" className={BADGE_ACCENT}>Activo</Badge>;
  if (isConfigured) return <Badge variant="outline" className={BADGE_PRIMARY}>Configurado</Badge>;
  return <Badge variant="outline" className={BADGE_OUTLINE}>Sin configurar</Badge>;
}

export default async function PagosPage() {
  const profile = await requireRole(["clinic_owner", "finance_user"]);
  const supabase = await createClient();

  const { data: providers } = await supabase
    .from("payment_providers")
    .select("*")
    .eq("clinic_id", profile.clinicId!);

  const manual = providers?.find((p) => p.provider_key === "manual_transfer");
  const wompi = providers?.find((p) => p.provider_key === "wompi");
  const inPerson = providers?.find((p) => p.provider_key === "in_person");
  const mercadoPago = providers?.find((p) => p.provider_key === "mercado_pago");
  const epayco = providers?.find((p) => p.provider_key === "epayco");
  const externalLink = providers?.find((p) => p.provider_key === "external_link");

  let manualInstructions = "";
  if (manual) {
    const { data: method } = await supabase
      .from("payment_methods")
      .select("instructions")
      .eq("payment_provider_id", manual.id)
      .maybeSingle();
    manualInstructions = method?.instructions ?? "";
  }

  return (
    <div className="max-w-3xl space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground">Centro de pagos</h1>
          <p className="mt-1 text-muted-foreground">
            Configura cómo tus pacientes pagan sus servicios. No guardamos datos de tarjetas ni exponemos tus llaves privadas.
          </p>
        </div>
        <Button variant="outline" render={<Link href="/dashboard/pagos/conciliacion" />}>
          Conciliación
        </Button>
      </div>

      <Card className="rounded-[16px] border-black/[0.07]">
        <CardHeader>
          <CardTitle>Transferencia bancaria</CardTitle>
          <CardDescription>El paciente transfiere y tu equipo confirma el pago manualmente.</CardDescription>
          <CardAction>
            <ProviderStatusBadge isActive={manual?.is_active ?? false} isConfigured={Boolean(manualInstructions)} />
          </CardAction>
        </CardHeader>
        <CardContent className="space-y-4">
          {manual && (
            <div className="flex items-center justify-between rounded-lg bg-muted/30 p-3 text-sm">
              <span>Transferencia bancaria activa</span>
              <ManualTransferToggle isActive={manual.is_active} />
            </div>
          )}
          <ManualTransferForm currentInstructions={manualInstructions} />
        </CardContent>
      </Card>

      <Card className="rounded-[16px] border-black/[0.07]">
        <CardHeader>
          <CardTitle>Pago presencial</CardTitle>
          <CardDescription>El paciente paga al llegar a su cita.</CardDescription>
          <CardAction>
            <ProviderStatusBadge isActive={inPerson?.is_active ?? false} isConfigured={Boolean(inPerson)} />
          </CardAction>
        </CardHeader>
        <CardContent>
          <InPersonToggle isActive={inPerson?.is_active ?? false} />
        </CardContent>
      </Card>

      <Card className="rounded-[16px] border-black/[0.07]">
        <CardHeader>
          <CardTitle>Wompi</CardTitle>
          <CardDescription>Pagos automáticos con tarjeta, PSE y más.</CardDescription>
          <CardAction>
            <ProviderStatusBadge isActive={wompi?.is_active ?? false} isConfigured={Boolean(wompi?.encrypted_credentials)} />
          </CardAction>
        </CardHeader>
        <CardContent>
          <WompiForm
            isConfigured={Boolean(wompi?.encrypted_credentials)}
            isActive={wompi?.is_active ?? false}
            isSandbox={wompi?.is_sandbox ?? true}
          />
        </CardContent>
      </Card>

      <Card className="rounded-[16px] border-black/[0.07]">
        <CardHeader>
          <CardTitle>Mercado Pago</CardTitle>
          <CardDescription>Pagos automáticos con tarjeta y otros medios locales.</CardDescription>
          <CardAction>
            <ProviderStatusBadge isActive={mercadoPago?.is_active ?? false} isConfigured={Boolean(mercadoPago?.encrypted_credentials)} />
          </CardAction>
        </CardHeader>
        <CardContent>
          <MercadoPagoForm
            isConfigured={Boolean(mercadoPago?.encrypted_credentials)}
            isActive={mercadoPago?.is_active ?? false}
            isSandbox={mercadoPago?.is_sandbox ?? true}
          />
        </CardContent>
      </Card>

      <Card className="rounded-[16px] border-black/[0.07]">
        <CardHeader>
          <CardTitle>ePayco</CardTitle>
          <CardDescription>Pagos automáticos con tarjeta, PSE y efectivo.</CardDescription>
          <CardAction>
            <ProviderStatusBadge isActive={epayco?.is_active ?? false} isConfigured={Boolean(epayco?.encrypted_credentials)} />
          </CardAction>
        </CardHeader>
        <CardContent>
          <EpaycoForm
            isConfigured={Boolean(epayco?.encrypted_credentials)}
            isActive={epayco?.is_active ?? false}
            isSandbox={epayco?.is_sandbox ?? true}
          />
        </CardContent>
      </Card>

      <Card className="rounded-[16px] border-black/[0.07]">
        <CardHeader>
          <CardTitle>Link externo de pago</CardTitle>
          <CardDescription>¿Ya tienes un link de cobro en otra plataforma? Pégalo aquí.</CardDescription>
          <CardAction>
            <ProviderStatusBadge isActive={externalLink?.is_active ?? false} isConfigured={Boolean(externalLink?.encrypted_credentials)} />
          </CardAction>
        </CardHeader>
        <CardContent>
          <ExternalLinkForm
            isConfigured={Boolean(externalLink?.encrypted_credentials)}
            isActive={externalLink?.is_active ?? false}
          />
        </CardContent>
      </Card>

      <Card className={cn("rounded-[16px] border-black/[0.07]", "opacity-60")}>
        <CardHeader>
          <CardTitle>PayU, Bold, PlaceToPay</CardTitle>
          <CardDescription>Arquitectura preparada — disponibles próximamente.</CardDescription>
          <CardAction>
            <Badge variant="outline" className={BADGE_OUTLINE}>Próximamente</Badge>
          </CardAction>
        </CardHeader>
        <CardContent />
      </Card>
    </div>
  );
}

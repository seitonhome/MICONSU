import type { PaymentProvider, CreateCheckoutInput, CheckoutSession, WebhookResult } from "../types";

/**
 * Link externo de pago: la clínica ya tiene un link de cobro creado en otra
 * plataforma (Bold, Wompi Link, PayPal.me, etc.) y solo lo pega aquí. No hay
 * checkout dinámico por monto ni webhook — el staff confirma el pago
 * manualmente desde Conciliación, igual que con transferencia bancaria.
 */
export class ExternalPaymentLinkProvider implements PaymentProvider {
  readonly providerKey = "external_link";
  readonly supportsAutomaticCheckout = true;

  constructor(private readonly linkUrl: string) {}

  async createCheckoutSession(_input: CreateCheckoutInput): Promise<CheckoutSession> {
    return { checkoutUrl: this.linkUrl };
  }

  validateWebhookSignature(): boolean {
    return false;
  }

  async handleWebhook(): Promise<WebhookResult> {
    return { signatureValid: false };
  }

  mapExternalStatusToInternalStatus(): "pending_confirmation" {
    return "pending_confirmation";
  }
}

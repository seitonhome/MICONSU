import type { PaymentProvider, WebhookResult } from "../types";

/** Pago presencial al llegar a la cita. Sin checkout ni webhook. */
export class InPersonProvider implements PaymentProvider {
  readonly providerKey = "in_person";
  readonly supportsAutomaticCheckout = false;

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

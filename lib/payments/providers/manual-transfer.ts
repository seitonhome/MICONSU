import type { PaymentProvider, WebhookResult } from "../types";

/**
 * No hay checkout automático ni webhook real: el paciente transfiere y sube
 * (opcional) un comprobante a manual_payment_proofs; el staff confirma desde
 * Conciliación. mapExternalStatusToInternalStatus existe solo para cumplir el
 * contrato común.
 */
export class ManualTransferProvider implements PaymentProvider {
  readonly providerKey = "manual_transfer";
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

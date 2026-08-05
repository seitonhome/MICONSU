import type { PaymentProvider, WebhookResult } from "../types";

/**
 * Proveedores con arquitectura preparada pero sin integración real todavía
 * (Fase 3). Satisfacen el contrato PaymentProvider para que provider-factory
 * y la UI puedan listarlos como "próximamente" en lugar de ocultarlos, sin
 * riesgo de que alguien los active por error: createCheckoutSession lanza en
 * vez de fallar en silencio.
 */
abstract class UnimplementedProvider implements PaymentProvider {
  abstract readonly providerKey: string;
  readonly supportsAutomaticCheckout = false;

  async createCheckoutSession(): Promise<never> {
    throw new Error(`${this.providerKey} todavía no está disponible. Próximamente.`);
  }

  validateWebhookSignature(): boolean {
    return false;
  }

  async handleWebhook(): Promise<WebhookResult> {
    return { signatureValid: false };
  }

  mapExternalStatusToInternalStatus(): "manual_review" {
    return "manual_review";
  }
}

export class PayUProvider extends UnimplementedProvider {
  readonly providerKey = "payu";
}

export class BoldProvider extends UnimplementedProvider {
  readonly providerKey = "bold";
}

export class PlaceToPayProvider extends UnimplementedProvider {
  readonly providerKey = "placetopay";
}

import type { Database } from "@/lib/supabase/types";

export type InternalPaymentStatus = Database["public"]["Enums"]["payment_status"];

export type CreateCheckoutInput = {
  /** payment_intents.id — se usa como referencia externa ante la pasarela. */
  reference: string;
  amount: number;
  currency: string;
  redirectUrl: string;
  customerEmail?: string | null;
  customerFullName?: string | null;
};

export type CheckoutSession = {
  checkoutUrl: string;
};

export type PaymentStatusResult = {
  status: InternalPaymentStatus;
  externalTransactionId?: string;
  raw?: unknown;
};

export type WebhookResult = {
  signatureValid: boolean;
  externalEventId?: string;
  externalReference?: string;
  status?: InternalPaymentStatus;
  externalTransactionId?: string;
};

/**
 * Contrato común para todas las pasarelas de pago (brief: "Centro de Pagos
 * multi-pasarela"). Cada proveedor traduce sus propios estados a
 * InternalPaymentStatus vía mapExternalStatusToInternalStatus, para que el
 * resto del sistema (conciliación, reportes, agenda) nunca dependa del
 * vocabulario específico de una pasarela.
 */
export interface PaymentProvider {
  readonly providerKey: string;

  /** true si el proveedor soporta checkout automático (redirect/widget). */
  readonly supportsAutomaticCheckout: boolean;

  createCheckoutSession?(input: CreateCheckoutInput): Promise<CheckoutSession>;
  getPaymentStatus?(externalReference: string): Promise<PaymentStatusResult>;
  validateWebhookSignature(payload: Record<string, unknown>, signatureHeader: string | null): boolean;
  handleWebhook(payload: Record<string, unknown>): Promise<WebhookResult>;
  mapExternalStatusToInternalStatus(externalStatus: string): InternalPaymentStatus;
  cancelPayment?(externalTransactionId: string): Promise<void>;
  refundPayment?(externalTransactionId: string, amount?: number): Promise<void>;
}

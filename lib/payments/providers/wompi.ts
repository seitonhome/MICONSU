import crypto from "node:crypto";
import type {
  PaymentProvider,
  CreateCheckoutInput,
  CheckoutSession,
  PaymentStatusResult,
  WebhookResult,
  InternalPaymentStatus,
} from "../types";

export type WompiCredentials = {
  publicKey: string;
  privateKey: string;
  eventsSecret: string;
  integritySecret: string;
};

/**
 * Wompi (Colombia) — Web Checkout + API de transacciones + Eventos (webhook).
 * Estructura de firma de integridad y de eventos según la documentación
 * pública de Wompi (https://docs.wompi.co) vigente al momento de escribir
 * esto. Verifica contra la documentación actual antes de salir a producción,
 * por si la pasarela cambia el formato de firma.
 */
export class WompiProvider implements PaymentProvider {
  readonly providerKey = "wompi";
  readonly supportsAutomaticCheckout = true;

  constructor(
    private readonly credentials: WompiCredentials,
    private readonly isSandbox: boolean,
  ) {}

  private get apiBaseUrl() {
    return this.isSandbox ? "https://sandbox.wompi.co/v1" : "https://production.wompi.co/v1";
  }

  async createCheckoutSession(input: CreateCheckoutInput): Promise<CheckoutSession> {
    const amountInCents = Math.round(input.amount * 100);
    const signature = crypto
      .createHash("sha256")
      .update(`${input.reference}${amountInCents}${input.currency}${this.credentials.integritySecret}`)
      .digest("hex");

    const params = new URLSearchParams({
      "public-key": this.credentials.publicKey,
      currency: input.currency,
      "amount-in-cents": String(amountInCents),
      reference: input.reference,
      "redirect-url": input.redirectUrl,
      "signature:integrity": signature,
    });

    if (input.customerEmail) params.set("customer-data:email", input.customerEmail);
    if (input.customerFullName) params.set("customer-data:full-name", input.customerFullName);

    return { checkoutUrl: `https://checkout.wompi.co/p/?${params.toString()}` };
  }

  /** Verifica que la llave pública sea válida ante Wompi (pantalla "Prueba de conexión"). */
  async testConnection(): Promise<{ ok: boolean; message: string }> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/merchants/${this.credentials.publicKey}`);
      if (!response.ok) return { ok: false, message: `Wompi respondió con error ${response.status}.` };
      const body = (await response.json()) as { data?: { name?: string } };
      return { ok: true, message: body.data?.name ? `Conectado como "${body.data.name}".` : "Conexión exitosa." };
    } catch {
      return { ok: false, message: "No pudimos conectar con Wompi. Verifica tu llave pública." };
    }
  }

  async getPaymentStatus(externalReference: string): Promise<PaymentStatusResult> {
    const response = await fetch(`${this.apiBaseUrl}/transactions?reference=${encodeURIComponent(externalReference)}`, {
      headers: { Authorization: `Bearer ${this.credentials.privateKey}` },
    });

    if (!response.ok) {
      return { status: "manual_review", raw: { httpStatus: response.status } };
    }

    const body = (await response.json()) as { data?: Array<{ id: string; status: string }> };
    const transaction = body.data?.[0];

    if (!transaction) return { status: "pending" };

    return {
      status: this.mapExternalStatusToInternalStatus(transaction.status),
      externalTransactionId: transaction.id,
      raw: transaction,
    };
  }

  validateWebhookSignature(payload: Record<string, unknown>): boolean {
    const signature = payload.signature as { properties?: string[]; checksum?: string } | undefined;
    const timestamp = payload.timestamp;
    if (!signature?.properties || !signature.checksum || timestamp === undefined) return false;

    const values = signature.properties.map((path) => getByPath(payload.data, path)).join("");
    const expected = crypto
      .createHash("sha256")
      .update(`${values}${timestamp}${this.credentials.eventsSecret}`)
      .digest("hex");

    return expected === signature.checksum;
  }

  async handleWebhook(payload: Record<string, unknown>): Promise<WebhookResult> {
    const signatureValid = this.validateWebhookSignature(payload);
    const data = payload.data as { transaction?: { id?: string; status?: string; reference?: string } } | undefined;
    const transaction = data?.transaction;

    if (!signatureValid || !transaction) {
      return { signatureValid };
    }

    return {
      signatureValid: true,
      externalEventId: transaction.id,
      externalReference: transaction.reference,
      externalTransactionId: transaction.id,
      status: transaction.status ? this.mapExternalStatusToInternalStatus(transaction.status) : undefined,
    };
  }

  mapExternalStatusToInternalStatus(externalStatus: string): InternalPaymentStatus {
    switch (externalStatus) {
      case "APPROVED":
        return "approved";
      case "DECLINED":
        return "rejected";
      case "VOIDED":
        return "cancelled";
      case "ERROR":
        return "failed";
      case "PENDING":
      default:
        return "pending";
    }
  }
}

function getByPath(obj: unknown, path: string): string {
  const value = path.split(".").reduce<unknown>((acc, key) => {
    if (acc && typeof acc === "object" && key in acc) return (acc as Record<string, unknown>)[key];
    return undefined;
  }, obj);
  return value === undefined || value === null ? "" : String(value);
}

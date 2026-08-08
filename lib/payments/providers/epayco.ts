import crypto from "node:crypto";
import type {
  PaymentProvider,
  CreateCheckoutInput,
  CheckoutSession,
  PaymentStatusResult,
  WebhookResult,
  InternalPaymentStatus,
} from "../types";

export type EpaycoCredentials = {
  publicKey: string;
  privateKey: string;
  customerId: string;
};

/**
 * ePayco (Colombia) — Checkout estándar por redirección firmada. Verifica
 * contra la documentación actual de ePayco (https://docs.epayco.com) antes de
 * salir a producción: el nombre exacto de los parámetros de checkout y de
 * confirmación (x_ref_payco, x_transaction_id, x_response, x_signature) ha
 * variado entre versiones de su API y este proveedor sigue el esquema más
 * estable documentado al momento de escribir esto.
 */
export class EpaycoProvider implements PaymentProvider {
  readonly providerKey = "epayco";
  readonly supportsAutomaticCheckout = true;

  constructor(
    private readonly credentials: EpaycoCredentials,
    private readonly isSandbox: boolean,
  ) {}

  /**
   * Verifica las llaves contra el endpoint de autenticación de ePayco
   * (Basic auth con publicKey:privateKey, devuelve un JWT si son válidas).
   */
  async testConnection(): Promise<{ ok: boolean; message: string }> {
    try {
      const basicAuth = Buffer.from(`${this.credentials.publicKey}:${this.credentials.privateKey}`).toString("base64");
      const response = await fetch("https://apify.epayco.co/login", {
        method: "POST",
        headers: { Authorization: `Basic ${basicAuth}`, "Content-Type": "application/json" },
      });
      if (!response.ok) return { ok: false, message: "Las llaves de ePayco no fueron aceptadas. Verifícalas." };
      const body = (await response.json()) as { token?: string };
      return body.token ? { ok: true, message: "Conexión exitosa." } : { ok: false, message: "ePayco no devolvió un token válido." };
    } catch {
      return { ok: false, message: "No pudimos conectar con ePayco." };
    }
  }

  async createCheckoutSession(input: CreateCheckoutInput): Promise<CheckoutSession> {
    const amount = input.amount.toFixed(2);
    const signature = crypto
      .createHash("sha256")
      .update(
        `${this.credentials.customerId}^${this.credentials.privateKey}^${input.reference}^${amount}^${input.currency}`,
      )
      .digest("hex");

    const params = new URLSearchParams({
      public_key: this.credentials.publicKey,
      p_cust_id_cliente: this.credentials.customerId,
      p_id_invoice: input.reference,
      p_amount: amount,
      p_currency_code: input.currency,
      p_signature: signature,
      p_url_response: input.redirectUrl,
      // p_url_confirmation es el webhook server-to-server; embebemos la
      // referencia en el query string para resolver la clínica antes de
      // descifrar credenciales (ePayco reenvía el query string tal cual).
      p_url_confirmation: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/epayco?ref=${encodeURIComponent(input.reference)}`,
      p_test_request: this.isSandbox ? "true" : "false",
    });

    if (input.customerEmail) params.set("p_email", input.customerEmail);
    if (input.customerFullName) params.set("p_billing_name", input.customerFullName);

    return { checkoutUrl: `https://checkout.epayco.co/checkout.php?${params.toString()}` };
  }

  /**
   * ePayco firma la confirmación con:
   * sha256(customerId^p_key^x_ref_payco^x_transaction_id^x_amount^x_currency_code)
   */
  validateWebhookSignature(payload: Record<string, unknown>): boolean {
    const refPayco = payload.x_ref_payco as string | undefined;
    const transactionId = payload.x_transaction_id as string | undefined;
    const amount = payload.x_amount as string | undefined;
    const currency = payload.x_currency_code as string | undefined;
    const signature = payload.x_signature as string | undefined;
    if (!refPayco || !transactionId || !amount || !currency || !signature) return false;

    const expected = crypto
      .createHash("sha256")
      .update(`${this.credentials.customerId}^${this.credentials.privateKey}^${refPayco}^${transactionId}^${amount}^${currency}`)
      .digest("hex");

    return expected === signature;
  }

  async handleWebhook(payload: Record<string, unknown>): Promise<WebhookResult> {
    const signatureValid = this.validateWebhookSignature(payload);
    if (!signatureValid) return { signatureValid: false };

    const transactionId = payload.x_transaction_id as string | undefined;
    const response = payload.x_response as string | undefined;
    const reference = payload.x_id_invoice as string | undefined;

    return {
      signatureValid: true,
      externalEventId: transactionId,
      externalReference: reference,
      externalTransactionId: transactionId,
      status: response ? this.mapExternalStatusToInternalStatus(response) : undefined,
    };
  }

  async getPaymentStatus(externalReference: string): Promise<PaymentStatusResult> {
    // ePayco no expone una consulta simple por referencia sin OAuth adicional;
    // el estado se actualiza vía webhook de confirmación (handleWebhook).
    // Se deja pending_review manual como fallback si se necesita consultar
    // fuera del webhook.
    return { status: "manual_review", raw: { externalReference } };
  }

  mapExternalStatusToInternalStatus(externalStatus: string): InternalPaymentStatus {
    switch (externalStatus.toLowerCase()) {
      case "aceptada":
        return "approved";
      case "rechazada":
        return "rejected";
      case "pendiente":
        return "pending_confirmation";
      case "fallida":
        return "failed";
      case "reversada":
        return "refunded";
      default:
        return "pending";
    }
  }
}

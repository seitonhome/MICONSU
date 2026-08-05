import crypto from "node:crypto";
import type {
  PaymentProvider,
  CreateCheckoutInput,
  CheckoutSession,
  PaymentStatusResult,
  WebhookResult,
  InternalPaymentStatus,
} from "../types";

export type MercadoPagoCredentials = {
  accessToken: string;
  webhookSecret: string;
};

/**
 * Mercado Pago (Checkout Pro) — crea una "preference" y redirige al init_point
 * devuelto por la API. Verifica contra la documentación actual de Mercado Pago
 * (https://www.mercadopago.com.co/developers) antes de salir a producción, en
 * especial el formato del header x-signature del webhook, que Mercado Pago ha
 * cambiado en el pasado.
 */
export class MercadoPagoProvider implements PaymentProvider {
  readonly providerKey = "mercado_pago";
  readonly supportsAutomaticCheckout = true;

  constructor(
    private readonly credentials: MercadoPagoCredentials,
    private readonly isSandbox: boolean,
  ) {}

  async createCheckoutSession(input: CreateCheckoutInput): Promise<CheckoutSession> {
    const response = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.credentials.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        items: [
          {
            title: "Cita en Mi Consultorio Pro",
            quantity: 1,
            currency_id: input.currency,
            unit_price: input.amount,
          },
        ],
        external_reference: input.reference,
        // Mercado Pago conserva los query params del notification_url al
        // reenviarlos en cada webhook, así que embebemos la referencia aquí
        // para poder resolver la clínica dueña del pago antes de descifrar
        // ninguna credencial.
        notification_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/mercado-pago?ref=${encodeURIComponent(input.reference)}`,
        back_urls: {
          success: input.redirectUrl,
          pending: input.redirectUrl,
          failure: input.redirectUrl,
        },
        auto_return: "approved",
        payer: input.customerEmail ? { email: input.customerEmail, name: input.customerFullName ?? undefined } : undefined,
      }),
    });

    if (!response.ok) {
      throw new Error(`Mercado Pago respondió con error ${response.status} al crear la preferencia.`);
    }

    const body = (await response.json()) as { init_point?: string; sandbox_init_point?: string };
    const checkoutUrl = this.isSandbox ? body.sandbox_init_point : body.init_point;
    if (!checkoutUrl) throw new Error("Mercado Pago no devolvió una URL de checkout.");

    return { checkoutUrl };
  }

  async getPaymentStatus(externalReference: string): Promise<PaymentStatusResult> {
    const response = await fetch(
      `https://api.mercadopago.com/v1/payments/search?external_reference=${encodeURIComponent(externalReference)}`,
      { headers: { Authorization: `Bearer ${this.credentials.accessToken}` } },
    );

    if (!response.ok) return { status: "manual_review", raw: { httpStatus: response.status } };

    const body = (await response.json()) as { results?: Array<{ id: number; status: string }> };
    const payment = body.results?.[0];
    if (!payment) return { status: "pending" };

    return {
      status: this.mapExternalStatusToInternalStatus(payment.status),
      externalTransactionId: String(payment.id),
      raw: payment,
    };
  }

  /**
   * Mercado Pago firma cada webhook con el header x-signature
   * ("ts=...,v1=...") calculado como HMAC-SHA256 sobre
   * `id:{data.id};request-id:{x-request-id};ts:{ts};` usando el secreto del
   * webhook configurado en el panel de integraciones.
   */
  validateWebhookSignature(payload: Record<string, unknown>, signatureHeader: string | null): boolean {
    if (!signatureHeader) return false;
    const parts = Object.fromEntries(
      signatureHeader.split(",").map((part) => {
        const [key, value] = part.split("=");
        return [key?.trim(), value?.trim()];
      }),
    );
    const ts = parts.ts;
    const v1 = parts.v1;
    const dataId = (payload.data as { id?: string } | undefined)?.id;
    const requestId = payload.__requestId as string | undefined;
    if (!ts || !v1 || !dataId) return false;

    const manifest = `id:${dataId};${requestId ? `request-id:${requestId};` : ""}ts:${ts};`;
    const expected = crypto.createHmac("sha256", this.credentials.webhookSecret).update(manifest).digest("hex");
    return expected === v1;
  }

  /**
   * El Route Handler debe inyectar `__signatureHeader` (x-signature) y
   * `__requestId` (x-request-id) en el payload antes de llamar a este método,
   * ya que la firma de Mercado Pago viaja en encabezados, no en el cuerpo.
   */
  async handleWebhook(payload: Record<string, unknown>): Promise<WebhookResult> {
    const signatureValid = this.validateWebhookSignature(payload, (payload.__signatureHeader as string) ?? null);
    const data = payload.data as { id?: string } | undefined;
    if (!signatureValid || !data?.id) return { signatureValid };

    const response = await fetch(`https://api.mercadopago.com/v1/payments/${data.id}`, {
      headers: { Authorization: `Bearer ${this.credentials.accessToken}` },
    }).catch(() => null);
    const payment = response?.ok ? ((await response.json()) as { id: number; status: string }) : null;

    return {
      signatureValid: true,
      externalEventId: data.id,
      externalTransactionId: payment ? String(payment.id) : data.id,
      status: payment ? this.mapExternalStatusToInternalStatus(payment.status) : undefined,
    };
  }

  mapExternalStatusToInternalStatus(externalStatus: string): InternalPaymentStatus {
    switch (externalStatus) {
      case "approved":
        return "approved";
      case "rejected":
        return "rejected";
      case "cancelled":
        return "cancelled";
      case "refunded":
        return "refunded";
      case "charged_back":
        return "manual_review";
      case "in_process":
      case "pending":
      default:
        return "pending";
    }
  }
}

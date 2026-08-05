import "server-only";
import { decryptCredentials } from "./crypto";
import { ManualTransferProvider } from "./providers/manual-transfer";
import { InPersonProvider } from "./providers/in-person";
import { WompiProvider } from "./providers/wompi";
import { MercadoPagoProvider } from "./providers/mercado-pago";
import { EpaycoProvider } from "./providers/epayco";
import { ExternalPaymentLinkProvider } from "./providers/external-link";
import { PayUProvider, BoldProvider, PlaceToPayProvider } from "./providers/stubs";
import type { PaymentProvider } from "./types";
import type { Database } from "@/lib/supabase/types";

type ProviderRow = Database["public"]["Tables"]["payment_providers"]["Row"];

/**
 * Instancia el provider correcto a partir de una fila de payment_providers.
 * Las credenciales cifradas nunca salen de esta función hacia el cliente.
 */
export function getPaymentProvider(row: ProviderRow): PaymentProvider | null {
  switch (row.provider_key) {
    case "manual_transfer":
      return new ManualTransferProvider();
    case "in_person":
      return new InPersonProvider();
    case "wompi": {
      if (!row.encrypted_credentials) return null;
      const creds = decryptCredentials(row.encrypted_credentials);
      return new WompiProvider(
        {
          publicKey: creds.publicKey,
          privateKey: creds.privateKey,
          eventsSecret: creds.eventsSecret,
          integritySecret: creds.integritySecret,
        },
        row.is_sandbox,
      );
    }
    case "mercado_pago": {
      if (!row.encrypted_credentials) return null;
      const creds = decryptCredentials(row.encrypted_credentials);
      return new MercadoPagoProvider(
        { accessToken: creds.accessToken, webhookSecret: creds.webhookSecret },
        row.is_sandbox,
      );
    }
    case "epayco": {
      if (!row.encrypted_credentials) return null;
      const creds = decryptCredentials(row.encrypted_credentials);
      return new EpaycoProvider(
        { publicKey: creds.publicKey, privateKey: creds.privateKey, customerId: creds.customerId },
        row.is_sandbox,
      );
    }
    case "external_link": {
      if (!row.encrypted_credentials) return null;
      const creds = decryptCredentials(row.encrypted_credentials);
      return new ExternalPaymentLinkProvider(creds.linkUrl);
    }
    case "payu":
      return new PayUProvider();
    case "bold":
      return new BoldProvider();
    case "placetopay":
      return new PlaceToPayProvider();
    default:
      return null;
  }
}

import "server-only";
import crypto from "node:crypto";

const ALGORITHM = "aes-256-gcm";

/** APP_ENCRYPTION_KEY: hex de 32 bytes. Generar con `openssl rand -hex 32`. */
function getKey(): Buffer {
  const hex = process.env.APP_ENCRYPTION_KEY;
  if (!hex || hex.length !== 64) {
    throw new Error(
      "APP_ENCRYPTION_KEY debe ser un hex de 32 bytes (64 caracteres). Genera uno con: openssl rand -hex 32",
    );
  }
  return Buffer.from(hex, "hex");
}

/** Cifra credenciales de pasarela antes de guardarlas en payment_providers.encrypted_credentials. */
export function encryptCredentials(data: Record<string, string>): string {
  const key = getKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const plaintext = Buffer.from(JSON.stringify(data), "utf8");
  const encrypted = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return Buffer.concat([iv, authTag, encrypted]).toString("base64");
}

/** Descifra credenciales. Solo debe llamarse desde código de servidor (Server Actions / Route Handlers). */
export function decryptCredentials(payload: string): Record<string, string> {
  const key = getKey();
  const raw = Buffer.from(payload, "base64");
  const iv = raw.subarray(0, 12);
  const authTag = raw.subarray(12, 28);
  const encrypted = raw.subarray(28);
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
  return JSON.parse(decrypted.toString("utf8")) as Record<string, string>;
}

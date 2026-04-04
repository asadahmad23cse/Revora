import crypto from "crypto";
import { logger } from "./logger";

function timingSafeEqualHex(aHex: string, bHex: string): boolean {
  try {
    const a = Buffer.from(aHex, "hex");
    const b = Buffer.from(bHex, "hex");
    if (a.length !== b.length || a.length === 0) return false;
    return crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

/**
 * Meta / WhatsApp Cloud API: `X-Hub-Signature-256: sha256=<hex>`
 */
export function verifyMetaHubSignature256(secret: string, rawBody: Buffer, headerValue: string | undefined): boolean {
  if (!headerValue) return false;
  const parts = headerValue.trim().split(",");
  for (const part of parts) {
    const trimmed = part.trim();
    if (!trimmed.startsWith("sha256=")) continue;
    const receivedHex = trimmed.slice("sha256=".length).trim();
    const expectedHex = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
    if (timingSafeEqualHex(expectedHex, receivedHex)) return true;
  }
  logger.warn("X-Hub-Signature-256 did not match any segment");
  return false;
}

/**
 * Generic hex HMAC header: `X-Revora-Signature: sha256=<hex>` (integration tests / custom proxies).
 */
export function verifyRevoraTestSignature(secret: string, rawBody: Buffer, headerValue: string | undefined): boolean {
  if (!headerValue) return false;
  const trimmed = headerValue.trim();
  if (!trimmed.startsWith("sha256=")) return false;
  const receivedHex = trimmed.slice("sha256=".length).trim();
  const expectedHex = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  return timingSafeEqualHex(expectedHex, receivedHex);
}

/**
 * Some BSPs send base64 HMAC digest: `v1,<base64>` (compare digest of raw body).
 */
export function verifyV1Base64Hmac(secret: string, rawBody: Buffer, headerValue: string | undefined): boolean {
  if (!headerValue) return false;
  const segments = headerValue.trim().split(/\s+/);
  const expectedB64 = crypto.createHmac("sha256", secret).update(rawBody).digest("base64");
  for (const seg of segments) {
    const m = /^v\d+,/i.exec(seg);
    if (!m) continue;
    const b64 = seg.slice(m[0].length).trim();
    if (!b64) continue;
    if (timingSafeEqualB64(expectedB64, b64)) return true;
  }
  return false;
}

function timingSafeEqualB64(aB64: string, bB64: string): boolean {
  try {
    const a = Buffer.from(aB64, "base64");
    const b = Buffer.from(bB64, "base64");
    if (a.length !== b.length || a.length === 0) return false;
    return crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export function verifyWebhookSignatures(
  secret: string,
  rawBody: Buffer,
  headers: {
    hubSignature256?: string | undefined;
    revoraSignature?: string | undefined;
    webhookSignature?: string | undefined;
  },
): boolean {
  if (headers.hubSignature256 && verifyMetaHubSignature256(secret, rawBody, headers.hubSignature256)) {
    return true;
  }
  if (headers.revoraSignature && verifyRevoraTestSignature(secret, rawBody, headers.revoraSignature)) {
    return true;
  }
  if (headers.webhookSignature && verifyV1Base64Hmac(secret, rawBody, headers.webhookSignature)) {
    return true;
  }
  return false;
}

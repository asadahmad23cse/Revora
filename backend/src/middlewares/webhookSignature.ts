import type { NextFunction, Request, Response } from "express";
import { config } from "../config";
import { verifyWebhookSignatures } from "../utils/webhookSignature";
import { HttpError } from "./httpError";
import { logger } from "../utils/logger";
import { simulateWebhookSchema } from "../models/webhook.dto";

function isSimulatePayload(body: unknown): boolean {
  return simulateWebhookSchema.safeParse(body).success;
}

/**
 * Verifies Meta `X-Hub-Signature-256` (and fallbacks) using `req.rawBody`.
 * Must run AFTER `captureRawJsonAndParse` ... WAIT — HMAC needs raw bytes before JSON parse.
 *
 * Order for webhook chain must be:
 * 1) express.raw → Buffer in req.body
 * 2) this middleware — verify using Buffer, optionally peek simulate without full trust
 * 3) captureRawJsonAndParse
 *
 * This file only verifies; it expects `req.body` is still a Buffer.
 */
export function verifyWebhookSignature(req: Request, _res: Response, next: NextFunction): void {
  const raw = req.body;
  if (!Buffer.isBuffer(raw)) {
    next(new HttpError(500, "Webhook route expects raw JSON body middleware", "server_misconfig"));
    return;
  }

  if (config.webhookSkipSignatureVerify) {
    if (config.nodeEnv === "production") {
      logger.warn("WEBHOOK_SKIP_SIGNATURE_VERIFY is enabled in production — not recommended");
    }
    return next();
  }

  let parsedForSim: unknown;
  try {
    const text = raw.length ? raw.toString("utf8") : "{}";
    parsedForSim = text.trim() === "" ? {} : JSON.parse(text);
  } catch {
    next(new HttpError(400, "Invalid JSON payload", "invalid_json"));
    return;
  }

  if (isSimulatePayload(parsedForSim) && config.webhookAllowSimulateWithoutSignature) {
    logger.debug("Simulate webhook accepted without HMAC (WEBHOOK_ALLOW_SIMULATE_WITHOUT_SIGNATURE)");
    return next();
  }

  if (!config.webhookAppSecret) {
    next(
      new HttpError(
        500,
        "WEBHOOK_APP_SECRET (or DIALOG360_WEBHOOK_SECRET) must be set when signature verification is on",
        "webhook_secret_missing",
      ),
    );
    return;
  }

  const hub = req.header("x-hub-signature-256");
  const revora = req.header("x-revora-signature");
  const wh = req.header("webhook-signature") ?? req.header("Webhook-Signature");

  const ok = verifyWebhookSignatures(config.webhookAppSecret, raw, {
    hubSignature256: hub,
    revoraSignature: revora,
    webhookSignature: wh,
  });

  if (!ok) {
    logger.warn({ reqId: (req as Request & { id?: string }).id }, "Rejected webhook with invalid signature");
    next(new HttpError(401, "Invalid webhook signature", "invalid_signature"));
    return;
  }

  next();
}

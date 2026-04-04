import type { Request, Response, NextFunction } from "express";
import { config } from "../config";
import { cloudInboundSchema } from "../models/webhook.dto";
import { WebhookService } from "../services/webhook.service";
import { logger } from "../utils/logger";

/** Returns the first string when Express parses `hub.*` style repeated query keys. */
function firstQuery(val: unknown): string | undefined {
  if (typeof val === "string") return val;
  if (Array.isArray(val) && val.length > 0 && typeof val[0] === "string") return val[0];
  return undefined;
}

/** Meta Cloud API webhook verification (GET); echoes `hub.challenge` when token matches. */
export function getMetaWhatsAppWebhookVerify(req: Request, res: Response): void {
  const mode = firstQuery(req.query["hub.mode"]);
  const token = firstQuery(req.query["hub.verify_token"]);
  const challenge = firstQuery(req.query["hub.challenge"]);
  if (
    mode === "subscribe" &&
    token === config.webhookVerifyToken &&
    challenge !== undefined &&
    challenge.length > 0
  ) {
    res.status(200).type("text/plain").send(challenge);
    return;
  }
  res.status(403).type("text/plain").send("Forbidden");
}

/** Logs customer display name and first message metadata for Meta inbound payloads when present. */
function logMetaInboundPreview(body: unknown, requestId: unknown): void {
  const parsed = cloudInboundSchema.safeParse(body);
  if (!parsed.success) return;
  const value = parsed.data.entry?.[0]?.changes?.[0]?.value;
  const msgs = value?.messages;
  if (!msgs || msgs.length === 0) return;
  const m0 = msgs[0];
  const customerName = value?.contacts?.[0]?.profile?.name;
  logger.info(
    {
      requestId: requestId === undefined || requestId === null ? undefined : String(requestId),
      customerName,
      waMessageId: m0?.id,
      waFrom: m0?.from,
      messageType: m0?.type,
    },
    "Meta Cloud API inbound message (preview)",
  );
}

function parseNumberHeader(value: string | undefined): number | undefined {
  if (value === undefined || value === "") return undefined;
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return undefined;
  return n;
}

export async function postWebhook(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const headerAov = parseNumberHeader(req.header("x-aov-inr"));
    const headerThreshold = parseNumberHeader(req.header("x-response-threshold-seconds"));
    const businessPhoneHeader = req.header("x-business-phone") ?? undefined;

    const result = await WebhookService.ingestRawPayload({
      body: req.body,
      businessPhoneHeader,
      headerFallback: {
        aovInr: headerAov,
        thresholdSeconds: headerThreshold,
      },
    });

    logger.info(
      {
        requestId: req.id,
        ...result,
      },
      "Webhook batch processed",
    );

    res.status(200).json({ ok: true, ...result });
  } catch (e) {
    next(e);
  }
}

/**
 * Meta Cloud API: signed JSON body optional; always responds 200 so Meta does not retry the delivery.
 */
export async function postMetaWhatsAppWebhook(req: Request, res: Response): Promise<void> {
  try {
    logMetaInboundPreview(req.body, req.id);
    await WebhookService.ingestRawPayload({
      body: req.body,
      businessPhoneHeader: undefined,
      headerFallback: {},
    });
  } catch (err) {
    logger.error({ requestId: req.id, err }, "Meta WhatsApp webhook ingest error (returning 200)");
  }
  res.status(200).json({ ok: true });
}

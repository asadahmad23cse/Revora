import type { Request, Response, NextFunction } from "express";
import { config } from "../config";
import { cloudInboundSchema } from "../models/webhook.dto";
import { telegramUpdateSchema, type TelegramMessage, type TelegramUpdate } from "../models/telegram.dto";
import { HttpError } from "../middlewares/httpError";
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

function getTelegramSecretHeader(req: Request): string {
  const fromTelegram = req.header("x-telegram-bot-api-secret-token");
  return (fromTelegram ?? "").trim();
}

function verifyTelegramWebhookSecret(req: Request): void {
  const expected = config.telegramWebhookSecret;
  if (!expected) return;
  const actual = getTelegramSecretHeader(req);
  if (!actual || actual !== expected) {
    throw new HttpError(401, "Invalid Telegram webhook secret", "invalid_telegram_secret");
  }
}

function pickTelegramMessage(update: TelegramUpdate): TelegramMessage | null {
  return update.message ?? update.edited_message ?? update.channel_post ?? update.edited_channel_post ?? null;
}

function deriveBusinessPhoneForTelegram(req: Request): string {
  const headerPhone = (req.header("x-business-phone") ?? "").trim();
  if (headerPhone) return headerPhone;
  if (config.defaultBusinessPhone) return config.defaultBusinessPhone;
  const botId = config.telegramBotToken.split(":")[0]?.trim();
  if (botId && /^[0-9]+$/.test(botId)) {
    return botId;
  }
  throw new HttpError(
    400,
    "Cannot determine business phone for Telegram webhook. Set DEFAULT_BUSINESS_PHONE or pass X-Business-Phone.",
    "missing_business_phone",
  );
}

function deriveCounterpartyPhoneForTelegram(msg: TelegramMessage): string {
  const raw = msg.from?.id ?? msg.chat.id;
  const absDigits = String(Math.abs(raw)).replace(/\D/g, "");
  const padded = absDigits.padStart(9, "0");
  return `99${padded}`;
}

function deriveTelegramMessageText(msg: TelegramMessage): string {
  const text = msg.text?.trim();
  if (text && text.length > 0) return text;
  const caption = msg.caption?.trim();
  if (caption && caption.length > 0) return caption;
  return "[telegram message]";
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

/**
 * Telegram bot webhook (JSON):
 * - verifies `x-telegram-bot-api-secret-token` when TELEGRAM_WEBHOOK_SECRET is configured
 * - maps inbound updates into the existing ingest pipeline using simulate payload format
 */
export async function postTelegramWebhook(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    verifyTelegramWebhookSecret(req);
    const parsed = telegramUpdateSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new HttpError(400, "Unsupported Telegram webhook payload", "invalid_payload", parsed.error.flatten());
    }

    const message = pickTelegramMessage(parsed.data);
    if (!message) {
      res.status(200).json({ ok: true, accepted: 0, skipped: 1, deduplicated: 0, reason: "no_message" });
      return;
    }
    if (message.from?.is_bot) {
      res.status(200).json({ ok: true, accepted: 0, skipped: 1, deduplicated: 0, reason: "bot_message" });
      return;
    }

    const businessPhone = deriveBusinessPhoneForTelegram(req);
    const counterpartyPhone = deriveCounterpartyPhoneForTelegram(message);
    const dedupeId = `tg:${message.chat.id}:${message.message_id}`;
    const text = deriveTelegramMessageText(message);
    const timestamp = message.date !== undefined ? message.date * 1000 : Date.now();

    const result = await WebhookService.ingestRawPayload({
      body: {
        simulate: true,
        business_phone: businessPhone,
        customer_phone: counterpartyPhone,
        direction: "incoming",
        text,
        wa_message_id: dedupeId,
        timestamp,
      },
      businessPhoneHeader: undefined,
      headerFallback: {},
    });

    logger.info(
      {
        requestId: req.id,
        dedupeId,
        businessPhone,
        counterpartyPhone,
        ...result,
      },
      "Telegram webhook processed",
    );

    res.status(200).json({ ok: true, provider: "telegram", ...result });
  } catch (e) {
    next(e);
  }
}

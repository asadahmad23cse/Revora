import { pool } from "../db/pool";
import { logger } from "../utils/logger";
import {
  cloudInboundSchema,
  simulateWebhookSchema,
  waMessageSchema,
  type SimulateWebhook,
} from "../models/webhook.dto";
import type { z } from "zod";
import { HttpError } from "../middlewares/httpError";
import { UserService } from "./user.service";
import { MessageService } from "./message.service";
import { MessageIngestQueue } from "../queues/messageIngest.queue";
import { config } from "../config";
import type { NormalizedWebhookMessage, MessageDirection } from "../types";
import { IdempotencyService } from "./idempotency.service";
import { UserConfigService } from "./userConfig.service";
import { UserLifecycleService } from "./userLifecycle.service";

type WaMessage = z.infer<typeof waMessageSchema>;

export type WebhookIngestResult = {
  accepted: number;
  skipped: number;
  deduplicated: number;
};

function parseTimestamp(raw: string | number | undefined): Date {
  if (raw === undefined) return new Date();
  if (typeof raw === "number") {
    return new Date(raw > 1e12 ? raw : raw * 1000);
  }
  const n = Number(raw);
  if (!Number.isNaN(n) && raw.trim() !== "" && /^[0-9.]+$/.test(raw.trim())) {
    return new Date(n > 1e12 ? n : n * 1000);
  }
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return new Date();
  return d;
}

function inferDirection(params: {
  businessPhone: string;
  from?: string;
  to?: string;
}): MessageDirection | null {
  const b = UserService.normalizePhone(params.businessPhone);
  const from = params.from ? UserService.normalizePhone(params.from) : "";
  const to = params.to ? UserService.normalizePhone(params.to) : "";
  if (from && from === b) return "outgoing";
  if (to && to === b) return "incoming";
  if (from && to) {
    if (from !== b && to === b) return "incoming";
    if (from === b && to !== b) return "outgoing";
  }
  if (from && !to && from !== b) return "incoming";
  if (from === b) return "outgoing";
  return null;
}

function normalizeSimulate(body: SimulateWebhook): NormalizedWebhookMessage {
  const ts = body.timestamp !== undefined ? parseTimestamp(body.timestamp) : new Date();
  const businessPhone = UserService.normalizePhone(body.business_phone);
  const customerPhone = UserService.normalizePhone(body.customer_phone);
  const direction = body.direction;
  return {
    waMessageId: body.wa_message_id ?? null,
    businessPhone,
    counterpartyPhone: customerPhone,
    direction,
    messageText: body.text ?? null,
    timestampMs: ts.getTime(),
  };
}

function flattenCloudMessages(body: unknown): WaMessage[] {
  const parsed = cloudInboundSchema.safeParse(body);
  if (!parsed.success) return [];
  const out: WaMessage[] = [];
  for (const entry of parsed.data.entry ?? []) {
    for (const change of entry.changes) {
      for (const msg of change.value.messages ?? []) {
        out.push(msg);
      }
    }
  }
  return out;
}

function resolveBusinessPhone(params: {
  headerPhone?: string;
  metadataPhone?: string;
  message: WaMessage;
}): string {
  const header = params.headerPhone?.trim();
  if (header) return UserService.normalizePhone(header);
  const meta = params.metadataPhone?.trim();
  if (meta) return UserService.normalizePhone(meta);
  const envDefault = config.defaultBusinessPhone;
  if (envDefault) return UserService.normalizePhone(envDefault);
  const to = params.message.to?.trim();
  const from = params.message.from?.trim();
  if (to && from && to !== from) {
    if (from !== to) return UserService.normalizePhone(to);
  }
  throw new HttpError(
    400,
    "Cannot determine business phone. Set DEFAULT_BUSINESS_PHONE or send X-Business-Phone.",
    "missing_business_phone",
  );
}

type WaMediaShape = {
  image?: { caption?: string };
  document?: { caption?: string; filename?: string };
  audio?: { id?: string };
  voice?: { id?: string };
};

function extractCloudMessageText(msg: WaMessage): string | null {
  if (msg.errors && msg.errors.length > 0) {
    return null;
  }
  const t = msg.type?.toLowerCase() ?? "";
  if (t === "text" || t === "") {
    return msg.text?.body ?? null;
  }
  if (t === "interactive") {
    return (
      msg.interactive?.button_reply?.title ??
      msg.interactive?.list_reply?.title ??
      msg.text?.body ??
      null
    );
  }
  if (t === "button") {
    return msg.text?.body ?? null;
  }
  const m = msg as WaMessage & WaMediaShape;
  if (t === "image") {
    const c = m.image?.caption?.trim();
    return c && c.length > 0 ? c : "[image]";
  }
  if (t === "document") {
    const c = m.document?.caption?.trim();
    if (c && c.length > 0) return c;
    const fn = m.document?.filename?.trim();
    if (fn && fn.length > 0) return `[document: ${fn}]`;
    return "[document]";
  }
  if (t === "audio" || t === "voice") {
    return "[audio]";
  }
  return null;
}

function normalizeCloudMessage(params: {
  msg: WaMessage;
  businessPhone: string;
}): NormalizedWebhookMessage | null {
  const { msg, businessPhone } = params;
  const from = msg.from?.trim();
  const to = msg.to?.trim();
  const direction = inferDirection({
    businessPhone,
    from,
    to,
  });
  if (!direction) {
    logger.warn({ from, to, businessPhone }, "Skipping message: could not infer direction");
    return null;
  }
  const counterparty =
    direction === "incoming"
      ? UserService.normalizePhone(from ?? "")
      : UserService.normalizePhone(to ?? "");
  if (!counterparty) {
    logger.warn({ msg }, "Skipping message: missing counterparty phone");
    return null;
  }

  if (!msg.id || !String(msg.id).trim()) {
    logger.warn({ from, to }, "Skipping Cloud message without wa_message id (dedupe unsafe)");
    return null;
  }

  let text = extractCloudMessageText(msg);
  const t = msg.type?.toLowerCase() ?? "";
  const supported =
    t === "text" ||
    t === "" ||
    t === "interactive" ||
    t === "button" ||
    t === "image" ||
    t === "document" ||
    t === "audio" ||
    t === "voice";
  if (!supported) {
    logger.info({ type: t, waMsgId: msg.id }, "Unsupported WhatsApp message type; skipping ingest");
    return null;
  }
  if (text === null && (t === "text" || t === "")) {
    logger.info({ waMsgId: msg.id }, "Text message without body; skipping");
    return null;
  }
  if (text === null) {
    text = `[${t || "message"}]`;
  }
  const ts = parseTimestamp(msg.timestamp);
  return {
    waMessageId: msg.id ?? null,
    businessPhone: UserService.normalizePhone(businessPhone),
    counterpartyPhone: counterparty,
    direction,
    messageText: text,
    timestampMs: ts.getTime(),
  };
}

export class WebhookService {
  static async ingestRawPayload(params: {
    body: unknown;
    businessPhoneHeader?: string;
    headerFallback: { aovInr?: number; thresholdSeconds?: number };
  }): Promise<WebhookIngestResult> {
    const sim = simulateWebhookSchema.safeParse(params.body);
    if (sim.success) {
      const n = normalizeSimulate(sim.data);
      const outcome = await WebhookService.persistAndEnqueue(n, params.headerFallback);
      return WebhookService.resultFromSingle(outcome);
    }

    if (typeof params.body !== "object" || params.body === null) {
      throw new HttpError(400, "JSON object body required", "invalid_payload");
    }
    if (!("entry" in params.body)) {
      throw new HttpError(
        400,
        "Expected Cloud API payload with `entry[]` or `{ simulate: true, ... }`.",
        "invalid_payload_shape",
      );
    }

    const parsedRoot = cloudInboundSchema.safeParse(params.body);
    if (!parsedRoot.success) {
      throw new HttpError(400, "Unsupported webhook payload", "invalid_payload", parsedRoot.error.flatten());
    }

    const messages = flattenCloudMessages(params.body);
    if (messages.length === 0) {
      logger.info("Webhook acknowledged with no messages (status-only or empty)");
      return { accepted: 0, skipped: 0, deduplicated: 0 };
    }

    let accepted = 0;
    let skipped = 0;
    let deduplicated = 0;
    const metaPhone =
      parsedRoot.data.entry?.[0]?.changes?.[0]?.value.metadata?.display_phone_number ?? undefined;

    for (const msg of messages) {
      if (msg.errors && msg.errors.length > 0) {
        logger.info({ waMsgId: msg.id }, "Skipping message with delivery errors payload");
        skipped += 1;
        continue;
      }
      try {
        const businessPhone = resolveBusinessPhone({
          headerPhone: params.businessPhoneHeader,
          metadataPhone: metaPhone,
          message: msg,
        });
        const normalized = normalizeCloudMessage({ msg, businessPhone });
        if (!normalized) {
          skipped += 1;
          continue;
        }
        const outcome = await WebhookService.persistAndEnqueue(normalized, params.headerFallback);
        const r = WebhookService.resultFromSingle(outcome);
        accepted += r.accepted;
        skipped += r.skipped;
        deduplicated += r.deduplicated;
      } catch (e) {
        if (e instanceof HttpError && e.code === "missing_business_phone") {
          throw e;
        }
        logger.warn({ err: e, waMsgId: msg.id }, "Skipping malformed message in batch");
        skipped += 1;
      }
    }

    return { accepted, skipped, deduplicated };
  }

  private static resultFromSingle(outcome: "inserted" | "duplicate_redis" | "duplicate_db"): WebhookIngestResult {
    if (outcome === "inserted") return { accepted: 1, skipped: 0, deduplicated: 0 };
    return { accepted: 0, skipped: 0, deduplicated: 1 };
  }

  static async persistAndEnqueue(
    normalized: NormalizedWebhookMessage,
    headerFallback: { aovInr?: number; thresholdSeconds?: number },
  ): Promise<"inserted" | "duplicate_redis" | "duplicate_db"> {
    if (normalized.waMessageId) {
      const existsAlready = await MessageService.waMessageExists(normalized.waMessageId);
      if (existsAlready) {
        logger.info(
          { waMessageId: normalized.waMessageId },
          "Webhook delivery id already stored; skipping duplicate ingest",
        );
        return "duplicate_db";
      }
      const claimed = await IdempotencyService.tryClaimWaDelivery(normalized.waMessageId);
      if (!claimed) {
        return "duplicate_redis";
      }
    }

    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const user = await UserService.upsertByPhone(normalized.businessPhone, client);
      const userCfg = UserConfigService.parseConfigJson(user.config);
      const effective = UserConfigService.resolveEffective(userCfg, headerFallback);

      const { id, inserted } = await MessageService.insertMessage(
        {
          userId: user.id,
          customerPhone: normalized.counterpartyPhone,
          messageText: normalized.messageText,
          direction: normalized.direction,
          timestamp: new Date(normalized.timestampMs),
          waMessageId: normalized.waMessageId,
        },
        client,
      );
      await client.query("COMMIT");

      if (inserted && normalized.direction === "incoming") {
        try {
          await UserLifecycleService.afterIncomingMessagePersisted({
            userId: user.id,
            messageId: id,
            inserted: true,
          });
        } catch (e) {
          logger.error(
            { err: e, userId: user.id, messageId: id },
            "User lifecycle hook failed after inbound message (message still stored)",
          );
        }
      }

      if (!inserted) {
        if (normalized.waMessageId) {
          await IdempotencyService.releaseClaim(normalized.waMessageId);
        }
        logger.info({ waMessageId: normalized.waMessageId }, "Duplicate message skipped (database idempotency)");
        return "duplicate_db";
      }

      try {
        await MessageIngestQueue.enqueue({
          messageId: id,
          thresholdSeconds: effective.thresholdSeconds,
          aovInr: effective.aovInr,
        });
        logger.info(
          {
            messageId: id,
            thresholdSeconds: effective.thresholdSeconds,
            aovInr: effective.aovInr,
          },
          "Message ingest job queued",
        );
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        const duplicateJob =
          /already exists/i.test(msg) || /Job.*exist/i.test(msg) || msg.includes("duplicate");
        if (duplicateJob) {
          logger.warn({ messageId: id }, "Ingest job already queued");
        } else {
          throw e;
        }
      }
      return "inserted";
    } catch (e) {
      try {
        await client.query("ROLLBACK");
      } catch {
        /* ignore */
      }
      if (normalized.waMessageId) {
        await IdempotencyService.releaseClaim(normalized.waMessageId);
      }
      throw e;
    } finally {
      client.release();
    }
  }
}

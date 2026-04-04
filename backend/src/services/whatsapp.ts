import { config } from "../config";
import { logger } from "../utils/logger";
import { UserService } from "./user.service";
import { MessageService } from "./message.service";

const RETRY_DELAYS_MS = [1000, 3000, 5000] as const;

/** Structured failure for non-2xx Meta Graph responses with optional `error.code`. */
export class MetaApiError extends Error {
  readonly code: number;

  constructor(code: number, message: string) {
    super(message);
    this.name = "MetaApiError";
    this.code = code;
  }
}

/** Extracts Meta Graph `error.code` / `error.message` when the response JSON includes `error`. */
function readMetaError(json: Record<string, unknown>): { code: number; message: string } | null {
  const errVal = json.error;
  if (typeof errVal !== "object" || errVal === null) return null;
  const e = errVal as Record<string, unknown>;
  const message = typeof e.message === "string" ? e.message : "Meta API error";
  const codeRaw = e.code;
  let code = 0;
  if (typeof codeRaw === "number" && Number.isFinite(codeRaw)) code = codeRaw;
  else if (typeof codeRaw === "string") {
    const n = Number(codeRaw);
    if (Number.isFinite(n)) code = n;
  }
  return { code, message };
}

/** Returns `messages[0].id` from a successful WhatsApp send JSON response. */
function readSentWaMessageId(json: Record<string, unknown>): string | null {
  const msgs = json.messages;
  if (!Array.isArray(msgs) || msgs.length === 0) return null;
  const first = msgs[0];
  if (typeof first !== "object" || first === null) return null;
  const id = (first as Record<string, unknown>).id;
  return typeof id === "string" ? id : null;
}

/** Normalizes configured API version to a Graph path segment such as `v18.0`. */
function graphApiVersion(): string {
  const v = config.whatsappApiVersion.trim();
  if (/^v\d/i.test(v)) return v;
  return `v${v}`;
}

/** Promise-based sleep used between Meta API retry attempts. */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Single Meta Graph POST to `/{phone-number-id}/messages` with bearer auth. */
async function metaPost(payload: Record<string, unknown>): Promise<Record<string, unknown>> {
  const ver = graphApiVersion();
  const url = `https://graph.facebook.com/${ver}/${config.whatsappPhoneNumberId}/messages`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.whatsappToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  let json: Record<string, unknown>;
  try {
    json = (await res.json()) as Record<string, unknown>;
  } catch {
    throw new MetaApiError(res.status, `Meta API: non-JSON response (${res.status})`);
  }
  if (!res.ok) {
    const parsed = readMetaError(json);
    throw new MetaApiError(parsed?.code ?? res.status, parsed?.message ?? `HTTP ${res.status}`);
  }
  return json;
}

/** Retries `action` three times with 1s, 3s, then 5s delay; returns null after logging the last error. */
async function withRetries<T>(label: string, action: () => Promise<T>): Promise<T | null> {
  let lastErr: unknown;
  for (let i = 0; i < RETRY_DELAYS_MS.length; i += 1) {
    try {
      return await action();
    } catch (e) {
      lastErr = e;
      if (i < RETRY_DELAYS_MS.length - 1) {
        await sleep(RETRY_DELAYS_MS[i]);
      }
    }
  }
  logger.error({ err: lastErr, label }, "WhatsApp Meta API: exhausted retries");
  return null;
}

/** Inserts an outgoing `messages` row after Meta accepts a send, when a user id is known. */
async function logOutgoing(params: {
  userId: string | null;
  toNormalized: string;
  messageText: string;
  waMessageId: string | null;
  logLabel: string;
}): Promise<void> {
  if (!params.userId) {
    logger.warn({ to: params.toNormalized, logLabel: params.logLabel }, "WhatsApp send: no owner user for phone; skip DB log");
    return;
  }
  if (!params.waMessageId) {
    logger.warn({ userId: params.userId, logLabel: params.logLabel }, "WhatsApp send: missing wa_message_id in response; skip DB log");
    return;
  }
  try {
    await MessageService.insertMessage({
      userId: params.userId,
      customerPhone: params.toNormalized,
      messageText: params.messageText,
      direction: "outgoing",
      timestamp: new Date(),
      waMessageId: params.waMessageId,
    });
  } catch (e) {
    logger.error({ err: e, userId: params.userId, logLabel: params.logLabel }, "WhatsApp send: failed to insert outgoing message row");
  }
}

/** Sends outbound text: Meta POST, optional DB log; resolves whether Graph returned success after retries. */
async function deliverPlainTextAndLog(to: string, body: string): Promise<boolean> {
  const normalizedTo = UserService.normalizePhone(to);
  const userId = await UserService.findUserIdByPhone(normalizedTo);
  const payload: Record<string, unknown> = {
    messaging_product: "whatsapp",
    to: normalizedTo,
    type: "text",
    text: { body },
  };
  const json = await withRetries("sendTextMessage", async () => metaPost(payload));
  if (json === null) return false;
  const waId = readSentWaMessageId(json);
  await logOutgoing({
    userId,
    toNormalized: normalizedTo,
    messageText: body,
    waMessageId: waId,
    logLabel: "sendTextMessage",
  });
  return true;
}

/** Sends a plain text WhatsApp message via Meta Cloud API with retries; logs failures without throwing. */
export async function sendTextMessage(to: string, body: string): Promise<void> {
  await deliverPlainTextAndLog(to, body);
}

/** Same as `sendTextMessage` but resolves false when Meta fails after retries (for dev tooling). */
export async function tryDeliverPlainTextWhatsApp(to: string, body: string): Promise<boolean> {
  return deliverPlainTextAndLog(to, body);
}

/** Sends an interactive button message (max 3 buttons) via Meta; logs outgoing row or swallows send failures after retries. */
export async function sendInteractiveButtons(
  to: string,
  bodyText: string,
  buttons: Array<{ id: string; title: string }>,
): Promise<void> {
  if (buttons.length > 3) {
    throw new Error("Meta interactive messages allow at most 3 reply buttons");
  }
  const normalizedTo = UserService.normalizePhone(to);
  const userId = await UserService.findUserIdByPhone(normalizedTo);
  const payload: Record<string, unknown> = {
    messaging_product: "whatsapp",
    to: normalizedTo,
    type: "interactive",
    interactive: {
      type: "button",
      body: { text: bodyText },
      action: {
        buttons: buttons.map((b) => ({
          type: "reply",
          reply: { id: b.id, title: b.title },
        })),
      },
    },
  };
  const json = await withRetries("sendInteractiveButtons", async () => metaPost(payload));
  if (json === null) return;
  const waId = readSentWaMessageId(json);
  const loggedText = `${bodyText}\n[interactive buttons: ${buttons.map((b) => b.id).join(", ")}]`;
  await logOutgoing({
    userId,
    toNormalized: normalizedTo,
    messageText: loggedText,
    waMessageId: waId,
    logLabel: "sendInteractiveButtons",
  });
}

/** Sends an approved template via Meta Cloud API with retries; logs a concise outgoing row on success. */
export async function sendTemplateMessage(
  to: string,
  templateName: string,
  languageCode: string,
  components: Array<Record<string, unknown>>,
): Promise<void> {
  const normalizedTo = UserService.normalizePhone(to);
  const userId = await UserService.findUserIdByPhone(normalizedTo);
  const payload: Record<string, unknown> = {
    messaging_product: "whatsapp",
    to: normalizedTo,
    type: "template",
    template: {
      name: templateName,
      language: { code: languageCode },
      components,
    },
  };
  const json = await withRetries("sendTemplateMessage", async () => metaPost(payload));
  if (json === null) return;
  const waId = readSentWaMessageId(json);
  const loggedText = `[template:${templateName}] lang=${languageCode}`;
  await logOutgoing({
    userId,
    toNormalized: normalizedTo,
    messageText: loggedText,
    waMessageId: waId,
    logLabel: "sendTemplateMessage",
  });
}

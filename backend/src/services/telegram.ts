import { config } from "../config";
import { logger } from "../utils/logger";
import { MessageService } from "./message.service";

const RETRY_DELAYS_MS = [1000, 3000, 5000] as const;

type TelegramSendResponse = {
  ok?: boolean;
  description?: string;
  result?: unknown;
};

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function telegramApiUrl(method: string): string {
  if (!config.telegramBotToken) {
    throw new Error("TELEGRAM_BOT_TOKEN is not configured");
  }
  return `https://api.telegram.org/bot${config.telegramBotToken}/${method}`;
}

async function postTelegram(method: string, body: Record<string, unknown>): Promise<TelegramSendResponse> {
  const res = await fetch(telegramApiUrl(method), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  let json: TelegramSendResponse;
  try {
    json = (await res.json()) as TelegramSendResponse;
  } catch {
    throw new Error(`Telegram API: non-JSON response (${res.status})`);
  }
  if (!res.ok || json.ok !== true) {
    const msg = json.description && json.description.length > 0 ? json.description : `HTTP ${res.status}`;
    throw new Error(`Telegram API error: ${msg}`);
  }
  return json;
}

function responseMessageId(resp: TelegramSendResponse): number | undefined {
  const result = resp.result;
  if (!result || typeof result !== "object") return undefined;
  const id = (result as { message_id?: unknown }).message_id;
  return typeof id === "number" ? id : undefined;
}

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
  logger.error({ err: lastErr, label }, "Telegram API: exhausted retries");
  return null;
}

async function logOutgoingTelegram(params: {
  userId?: string;
  chatId: string;
  messageText: string;
  telegramMessageId?: number;
}): Promise<void> {
  if (!params.userId) return;
  const uniqueId =
    params.telegramMessageId !== undefined
      ? `tg-out:${params.chatId}:${params.telegramMessageId}`
      : `tg-out:${params.chatId}:${Date.now()}`;
  try {
    await MessageService.insertMessage({
      userId: params.userId,
      customerPhone: `telegram:${params.chatId}`,
      messageText: params.messageText,
      direction: "outgoing",
      timestamp: new Date(),
      waMessageId: uniqueId,
    });
  } catch (err) {
    logger.error({ err, userId: params.userId, chatId: params.chatId }, "Telegram send: failed to log outgoing message");
  }
}

async function deliverPlainTextAndLog(chatId: string, body: string, userId?: string): Promise<boolean> {
  const chat = chatId.trim();
  if (!chat) {
    logger.error("Telegram send: empty chat id");
    return false;
  }
  const response = await withRetries("sendTelegramTextMessage", async () =>
    postTelegram("sendMessage", { chat_id: chat, text: body }),
  );
  if (response === null) return false;
  await logOutgoingTelegram({
    userId,
    chatId: chat,
    messageText: body,
    telegramMessageId: responseMessageId(response),
  });
  return true;
}

export async function sendTelegramTextMessage(chatId: string, body: string, userId?: string): Promise<void> {
  await deliverPlainTextAndLog(chatId, body, userId);
}

export async function tryDeliverPlainTextTelegram(chatId: string, body: string, userId?: string): Promise<boolean> {
  return deliverPlainTextAndLog(chatId, body, userId);
}

export async function getTelegramBotInfo(): Promise<unknown | null> {
  const response = await withRetries("telegram.getMe", async () => postTelegram("getMe", {}));
  return response?.result ?? null;
}

export async function getTelegramWebhookInfo(): Promise<unknown | null> {
  const response = await withRetries("telegram.getWebhookInfo", async () =>
    postTelegram("getWebhookInfo", {}),
  );
  return response?.result ?? null;
}

export async function setTelegramWebhook(params: {
  url: string;
  secretToken?: string;
}): Promise<boolean> {
  const payload: Record<string, unknown> = {
    url: params.url,
  };
  const secret = params.secretToken?.trim();
  if (secret) payload.secret_token = secret;
  const response = await withRetries("telegram.setWebhook", async () => postTelegram("setWebhook", payload));
  if (!response) return false;
  return response.ok === true;
}

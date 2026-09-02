import { env } from "./env";

function envBool(raw: string | undefined, defaultVal: boolean): boolean {
  if (raw === undefined || raw === "") return defaultVal;
  return raw === "1" || raw.toLowerCase() === "true";
}

function envOrigins(raw: string | undefined): string[] {
  return (raw ?? "")
    .split(",")
    .map((origin) => origin.trim().replace(/\/$/, ""))
    .filter(Boolean);
}

export const config = {
  nodeEnv: env.NODE_ENV,
  port: env.PORT,
  logLevel: env.LOG_LEVEL,
  frontendOrigins: envOrigins(env.FRONTEND_ORIGINS),
  trustProxy: envBool(env.TRUST_PROXY, env.NODE_ENV === "production"),

  databaseUrl: env.DATABASE_URL,
  databaseUseSsl: env.DATABASE_SSL === "true" || /sslmode=require/i.test(env.DATABASE_URL),
  databaseRejectUnauthorized: env.DATABASE_SSL_REJECT_UNAUTHORIZED !== "false",

  redisUrl: env.REDIS_URL,

  defaultAovInr: env.DEFAULT_AOV_INR,
  responseThresholdSeconds: env.RESPONSE_THRESHOLD_SECONDS,

  webhookVerifyToken: (env.WEBHOOK_VERIFY_TOKEN ?? "").trim(),
  /** Meta / WhatsApp Cloud: App Secret — used for X-Hub-Signature-256 (360dialog uses same header) */
  webhookAppSecret: (env.WEBHOOK_APP_SECRET ?? env.DIALOG360_WEBHOOK_SECRET ?? "").trim(),

  /** 360dialog / Cloud API: WABA outbound auth (d360-api-key) — optional until send path is used */
  threeSixtyDialogApiKey: (env.THREESIXTY_DIALOG_API_KEY ?? "").trim(),
  /** Partner API token (future); optional */
  threeSixtyDialogPartnerToken: (env.THREESIXTY_DIALOG_PARTNER_TOKEN ?? "").trim(),
  /** When true, signature verification is skipped (development / staging only). */
  webhookSkipSignatureVerify: envBool(env.WEBHOOK_SKIP_SIGNATURE_VERIFY, env.NODE_ENV !== "production"),
  /** Allow `{ simulate: true }` payloads without HMAC when verification is enabled */
  webhookAllowSimulateWithoutSignature: envBool(env.WEBHOOK_ALLOW_SIMULATE_WITHOUT_SIGNATURE, true),

  defaultBusinessPhone: (env.DEFAULT_BUSINESS_PHONE ?? "").trim(),

  /** Meta WhatsApp Cloud API (Graph outbound) */
  whatsappToken: (env.WHATSAPP_TOKEN ?? "").trim(),
  whatsappPhoneNumberId: (env.WHATSAPP_PHONE_NUMBER_ID ?? "").trim(),
  whatsappApiVersion: env.WHATSAPP_API_VERSION.trim(),

  /** Telegram bot integration (optional fallback channel). */
  telegramBotToken: (env.TELEGRAM_BOT_TOKEN ?? "").trim(),
  telegramWebhookSecret: (env.TELEGRAM_WEBHOOK_SECRET ?? "").trim(),
  telegramOwnerChatId: (env.TELEGRAM_OWNER_CHAT_ID ?? "").trim(),
  messagingProvider: env.MESSAGING_PROVIDER,

  /** BullMQ */
  queueMaxAttempts: env.QUEUE_MAX_ATTEMPTS,
  queueBackoffMs: env.QUEUE_BACKOFF_MS,
  queueRemoveOnComplete: env.QUEUE_REMOVE_ON_COMPLETE_COUNT,
  queueRemoveOnFail: env.QUEUE_REMOVE_ON_FAIL_COUNT,

  conversationLockTtlSeconds: env.CONVERSATION_LOCK_TTL_SECONDS,
  idempotencyWaTtlSeconds: env.IDEMPOTENCY_WA_TTL_SECONDS,

  /** Rate limits (per IP) */
  webhookRateLimitWindowMs: env.WEBHOOK_RATE_LIMIT_WINDOW_MS,
  webhookRateLimitMax: env.WEBHOOK_RATE_LIMIT_MAX,
  globalRateLimitWindowMs: env.GLOBAL_RATE_LIMIT_WINDOW_MS,
  globalRateLimitMax: env.GLOBAL_RATE_LIMIT_MAX,

  /** After this many inbound messages for a user, enqueue the first 14-day report (once per user). */
  firstReportIncomingMessageThreshold: env.FIRST_REPORT_INCOMING_MESSAGE_THRESHOLD,

  /**
   * When true (or ALLOW_TEST_SIMULATE_API=true), POST /api/test/simulate-inbound is enabled.
   * Keep false in production unless you intentionally expose this helper.
   */
  testMode: envBool(env.TEST_MODE, false),
  allowTestSimulateApi: envBool(env.ALLOW_TEST_SIMULATE_API, false),

  /** When set, GET/PATCH /api/leads and GET /api/metrics require header X-Admin-Key: <value> */
  adminApiKey: (env.ADMIN_API_KEY ?? "").trim(),

  /** BullMQ repeatable job: scan leads due for follow-up */
  leadFollowupScanIntervalMs: env.LEAD_FOLLOWUP_SCAN_INTERVAL_MS,

  /** Groq Cloud (optional; AI follow-up copy in /ai/generate-message) */
  groqApiKey: (env.GROQ_API_KEY ?? "").trim(),

  /** JWT signing (7d expiry for api/auth) */
  jwtSecret: env.JWT_SECRET ?? "revora-development-only-jwt-secret-change-me",
} as const;

export function isTestSimulateApiEnabled(): boolean {
  return config.testMode || config.allowTestSimulateApi;
}

export type AppConfig = typeof config;

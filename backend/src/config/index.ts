import "dotenv/config";

function required(name: string): string {
  const v = process.env[name];
  if (!v || !v.trim()) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return v.trim();
}

function optionalNumber(name: string, fallback: number): number {
  const v = process.env[name];
  if (v === undefined || v === "") return fallback;
  const n = Number(v);
  if (!Number.isFinite(n)) {
    throw new Error(`Invalid number for ${name}`);
  }
  return n;
}

function optionalBool(name: string, fallback: boolean): boolean {
  const v = process.env[name];
  if (v === undefined || v === "") return fallback;
  return v === "1" || v.toLowerCase() === "true";
}

const nodeEnv = process.env.NODE_ENV ?? "development";

export const config = {
  nodeEnv,
  port: optionalNumber("PORT", 8080),
  logLevel: process.env.LOG_LEVEL ?? "info",

  databaseUrl: required("DATABASE_URL"),
  databaseUseSsl:
    process.env.DATABASE_SSL === "true" ||
    /sslmode=require/i.test(process.env.DATABASE_URL ?? ""),
  databaseRejectUnauthorized: process.env.DATABASE_SSL_REJECT_UNAUTHORIZED !== "false",

  redisUrl: required("REDIS_URL"),

  defaultAovInr: optionalNumber("DEFAULT_AOV_INR", 350),
  responseThresholdSeconds: optionalNumber("RESPONSE_THRESHOLD_SECONDS", 300),

  webhookVerifyToken: process.env.WEBHOOK_VERIFY_TOKEN ?? "",
  /** Meta / WhatsApp Cloud: App Secret — used for X-Hub-Signature-256 */
  webhookAppSecret: (process.env.WEBHOOK_APP_SECRET ?? process.env.DIALOG360_WEBHOOK_SECRET ?? "").trim(),
  /** When true, signature verification is skipped (development / staging only). */
  webhookSkipSignatureVerify: optionalBool("WEBHOOK_SKIP_SIGNATURE_VERIFY", nodeEnv !== "production"),
  /** Allow `{ simulate: true }` payloads without HMAC when verification is enabled */
  webhookAllowSimulateWithoutSignature: optionalBool("WEBHOOK_ALLOW_SIMULATE_WITHOUT_SIGNATURE", true),

  defaultBusinessPhone: (process.env.DEFAULT_BUSINESS_PHONE ?? "").trim(),

  /** BullMQ */
  queueMaxAttempts: optionalNumber("QUEUE_MAX_ATTEMPTS", 8),
  queueBackoffMs: optionalNumber("QUEUE_BACKOFF_MS", 2000),
  queueRemoveOnComplete: optionalNumber("QUEUE_REMOVE_ON_COMPLETE_COUNT", 2000),
  queueRemoveOnFail: optionalNumber("QUEUE_REMOVE_ON_FAIL_COUNT", 5000),

  conversationLockTtlSeconds: optionalNumber("CONVERSATION_LOCK_TTL_SECONDS", 45),
  idempotencyWaTtlSeconds: optionalNumber("IDEMPOTENCY_WA_TTL_SECONDS", 172800),

  /** Rate limits (per IP) */
  webhookRateLimitWindowMs: optionalNumber("WEBHOOK_RATE_LIMIT_WINDOW_MS", 60_000),
  webhookRateLimitMax: optionalNumber("WEBHOOK_RATE_LIMIT_MAX", 600),
  globalRateLimitWindowMs: optionalNumber("GLOBAL_RATE_LIMIT_WINDOW_MS", 60_000),
  globalRateLimitMax: optionalNumber("GLOBAL_RATE_LIMIT_MAX", 2000),

  /** After this many inbound messages, enqueue first 14-day report (once per user). */
  firstReportIncomingMessageThreshold: optionalNumber("FIRST_REPORT_INCOMING_MESSAGE_THRESHOLD", 10),

  /**
   * When true (or ALLOW_TEST_SIMULATE_API=true), POST /api/test/simulate-inbound is enabled.
   * Keep false in production unless you intentionally expose this helper.
   */
  testMode: optionalBool("TEST_MODE", false),
  allowTestSimulateApi: optionalBool("ALLOW_TEST_SIMULATE_API", false),

  /** When set, GET/PATCH /api/leads and GET /api/metrics require header X-Admin-Key: <value> */
  adminApiKey: (process.env.ADMIN_API_KEY ?? "").trim(),

  /** BullMQ repeatable job: scan leads due for follow-up */
  leadFollowupScanIntervalMs: optionalNumber("LEAD_FOLLOWUP_SCAN_INTERVAL_MS", 300_000),
} as const;

export function isTestSimulateApiEnabled(): boolean {
  return config.testMode || config.allowTestSimulateApi;
}

export type AppConfig = typeof config;

import "dotenv/config";
import { z } from "zod";

/** Coerce optional env string to number with fallback when missing or invalid. */
function numDef(defaultVal: number): z.ZodType<number, z.ZodTypeDef, unknown> {
  return z.preprocess((v) => {
    if (v === undefined || v === "" || v === null) return defaultVal;
    const n = Number(v);
    return Number.isFinite(n) ? n : defaultVal;
  }, z.number());
}

const EnvSchema = z.object({
  NODE_ENV: z.string().min(1),
  PORT: z.coerce.number().int().positive(),
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().min(1),
  WHATSAPP_TOKEN: z.string().min(1),
  WHATSAPP_PHONE_NUMBER_ID: z.string().min(1),
  WEBHOOK_VERIFY_TOKEN: z.string().min(1),
  LOG_LEVEL: z.preprocess((v) => (v === undefined || v === "" ? "info" : v), z.string().min(1)),
  WHATSAPP_API_VERSION: z.preprocess(
    (v) => (v === undefined || v === "" ? "v18.0" : v),
    z.string().min(1),
  ),

  DATABASE_SSL: z.string().optional(),
  DATABASE_SSL_REJECT_UNAUTHORIZED: z.string().optional(),
  WEBHOOK_APP_SECRET: z.string().optional(),
  DIALOG360_WEBHOOK_SECRET: z.string().optional(),
  THREESIXTY_DIALOG_API_KEY: z.string().optional(),
  THREESIXTY_DIALOG_PARTNER_TOKEN: z.string().optional(),
  DEFAULT_BUSINESS_PHONE: z.string().optional(),
  ADMIN_API_KEY: z.string().optional(),
  WEBHOOK_SKIP_SIGNATURE_VERIFY: z.string().optional(),
  WEBHOOK_ALLOW_SIMULATE_WITHOUT_SIGNATURE: z.string().optional(),

  DEFAULT_AOV_INR: numDef(350),
  RESPONSE_THRESHOLD_SECONDS: numDef(300),
  QUEUE_MAX_ATTEMPTS: numDef(8),
  QUEUE_BACKOFF_MS: numDef(2000),
  QUEUE_REMOVE_ON_COMPLETE_COUNT: numDef(2000),
  QUEUE_REMOVE_ON_FAIL_COUNT: numDef(5000),
  CONVERSATION_LOCK_TTL_SECONDS: numDef(45),
  IDEMPOTENCY_WA_TTL_SECONDS: numDef(172_800),
  WEBHOOK_RATE_LIMIT_WINDOW_MS: numDef(60_000),
  WEBHOOK_RATE_LIMIT_MAX: numDef(600),
  GLOBAL_RATE_LIMIT_WINDOW_MS: numDef(60_000),
  GLOBAL_RATE_LIMIT_MAX: numDef(2000),
  FIRST_REPORT_INCOMING_MESSAGE_THRESHOLD: numDef(10),
  LEAD_FOLLOWUP_SCAN_INTERVAL_MS: numDef(300_000),

  TEST_MODE: z.string().optional(),
  ALLOW_TEST_SIMULATE_API: z.string().optional(),

  GROQ_API_KEY: z.string().optional(),
});

/** Validates process.env at import; throws before the HTTP server or workers start. */
function loadEnv(): z.infer<typeof EnvSchema> {
  const result = EnvSchema.safeParse(process.env);
  if (!result.success) {
    const issue = result.error.issues[0];
    const name = issue?.path[0] !== undefined ? String(issue.path[0]) : "environment";
    throw new Error(`Startup failed: Missing required env var: ${name}`);
  }
  return result.data;
}

export const env = loadEnv();

export type AppEnv = z.infer<typeof EnvSchema>;

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
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(8080),
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().min(1),
  WHATSAPP_TOKEN: z.string().optional(),
  WHATSAPP_PHONE_NUMBER_ID: z.string().optional(),
  WEBHOOK_VERIFY_TOKEN: z.string().optional(),
  /** Comma-separated browser origins allowed to call the API directly. */
  FRONTEND_ORIGINS: z.string().optional(),
  /** Enable Express proxy awareness when deployed behind a trusted load balancer. */
  TRUST_PROXY: z.string().optional(),
  TELEGRAM_BOT_TOKEN: z.string().optional(),
  TELEGRAM_WEBHOOK_SECRET: z.string().optional(),
  TELEGRAM_OWNER_CHAT_ID: z.string().optional(),
  MESSAGING_PROVIDER: z.preprocess(
    (v) => (v === undefined || v === "" ? "whatsapp" : String(v).toLowerCase()),
    z.enum(["whatsapp", "telegram"]),
  ),
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
  QUEUE_DRAIN_DELAY_SECONDS: numDef(5),
  QUEUE_STALLED_INTERVAL_MS: numDef(30_000),
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
  GROQ_MODEL: z.string().min(1).default("openai/gpt-oss-20b"),

  /** HS256 secret for POST /api/auth/register + /api/auth/login tokens */
  JWT_SECRET: z.string().min(32).optional(),
}).superRefine((value, ctx) => {
  if (value.NODE_ENV !== "production") return;

  const required = (key: string, valueToCheck: string | undefined, message = "is required in production") => {
    if (!valueToCheck?.trim()) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: [key], message: `${key} ${message}` });
    }
  };

  required("JWT_SECRET", value.JWT_SECRET, "must be at least 32 characters in production");
  required("FRONTEND_ORIGINS", value.FRONTEND_ORIGINS);

  if (value.WEBHOOK_SKIP_SIGNATURE_VERIFY === "true" || value.WEBHOOK_SKIP_SIGNATURE_VERIFY === "1") {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["WEBHOOK_SKIP_SIGNATURE_VERIFY"],
      message: "WEBHOOK_SKIP_SIGNATURE_VERIFY must be false in production",
    });
  }
  if (value.WEBHOOK_ALLOW_SIMULATE_WITHOUT_SIGNATURE === "true" || value.WEBHOOK_ALLOW_SIMULATE_WITHOUT_SIGNATURE === "1") {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["WEBHOOK_ALLOW_SIMULATE_WITHOUT_SIGNATURE"],
      message: "WEBHOOK_ALLOW_SIMULATE_WITHOUT_SIGNATURE must be false in production",
    });
  }

  if (value.MESSAGING_PROVIDER === "whatsapp") {
    required("WHATSAPP_TOKEN", value.WHATSAPP_TOKEN);
    required("WHATSAPP_PHONE_NUMBER_ID", value.WHATSAPP_PHONE_NUMBER_ID);
    required("WEBHOOK_VERIFY_TOKEN", value.WEBHOOK_VERIFY_TOKEN);
    required("WEBHOOK_APP_SECRET", value.WEBHOOK_APP_SECRET ?? value.DIALOG360_WEBHOOK_SECRET);
  } else {
    required("TELEGRAM_BOT_TOKEN", value.TELEGRAM_BOT_TOKEN);
    required("TELEGRAM_WEBHOOK_SECRET", value.TELEGRAM_WEBHOOK_SECRET);
    required("TELEGRAM_OWNER_CHAT_ID", value.TELEGRAM_OWNER_CHAT_ID);
  }
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

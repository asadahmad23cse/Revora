import rateLimit from "express-rate-limit";
import { RedisStore } from "rate-limit-redis";
import { config } from "../config";
import { redisRateLimitSendCommand } from "../utils/redisRateLimitCommand";

/**
 * Stricter limit for POST /webhook (abuse protection).
 */
export const webhookRateLimiter = rateLimit({
  windowMs: config.webhookRateLimitWindowMs,
  limit: config.webhookRateLimitMax,
  standardHeaders: true,
  legacyHeaders: false,
  store: new RedisStore({
    sendCommand: redisRateLimitSendCommand,
    prefix: "rl:webhook:",
  }),
});

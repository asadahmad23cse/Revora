import rateLimit from "express-rate-limit";
import { RedisStore } from "rate-limit-redis";
import { config } from "../config";
import { redisRateLimitSendCommand } from "../utils/redisRateLimitCommand";

export const globalRateLimiter = rateLimit({
  windowMs: config.globalRateLimitWindowMs,
  limit: config.globalRateLimitMax,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.path === "/health",
  store: new RedisStore({
    sendCommand: redisRateLimitSendCommand,
    prefix: "rl:global:",
  }),
});

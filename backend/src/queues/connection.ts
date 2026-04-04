import IORedis from "ioredis";
import { config } from "../config";
import { logger } from "../utils/logger";

/**
 * BullMQ requires `maxRetriesPerRequest: null` on ioredis.
 */
export const redisConnection = new IORedis(config.redisUrl, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
});

redisConnection.on("error", (err) => {
  logger.error({ err }, "Redis connection error");
});

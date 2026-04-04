import { createServer } from "http";
import { createApp } from "./app";
import { config } from "./config";
import { logger } from "./utils/logger";
import { registerWorkers, workers } from "./queues/workers/registerWorkers";
import { LeadFollowupQueue } from "./queues/leadFollowup.queue";
import { pool } from "./db/pool";
import { redisConnection } from "./queues/connection";

async function shutdown(signal: string): Promise<void> {
  logger.info({ signal }, "Shutting down gracefully");

  for (const w of workers) {
    await w.close();
  }

  await pool.end().catch((err) => logger.error({ err }, "pool.end error"));
  await redisConnection.quit().catch((err) => logger.error({ err }, "redis.quit error"));

  process.exit(0);
}

async function main(): Promise<void> {
  registerWorkers();
  await LeadFollowupQueue.ensureRepeatingScan(config.leadFollowupScanIntervalMs);

  const app = createApp();
  const server = createServer(app);

  server.listen(config.port, () => {
    logger.info({ port: config.port, env: config.nodeEnv }, "Revora API listening");
  });

  process.on("SIGINT", () => void shutdown("SIGINT"));
  process.on("SIGTERM", () => void shutdown("SIGTERM"));
}

main().catch((err) => {
  logger.error({ err }, "Fatal startup error");
  process.exit(1);
});

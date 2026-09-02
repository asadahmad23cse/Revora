import "./config/env";
import { createServer, type Server } from "http";
import { createApp } from "./app";
import { config } from "./config";
import { logger } from "./utils/logger";
import { registerWorkers, workers } from "./queues/workers/registerWorkers";
import { LeadFollowupQueue } from "./queues/leadFollowup.queue";
import { pool } from "./db/pool";
import { redisConnection } from "./queues/connection";

let httpServer: Server | undefined;

/** Stops HTTP, waits up to 10s for BullMQ workers, then closes Postgres and Redis. */
async function shutdown(signal: string): Promise<void> {
  logger.info({ signal }, "Shutting down gracefully");

  await new Promise<void>((resolve, reject) => {
    if (!httpServer) {
      resolve();
      return;
    }
    httpServer.close((err) => (err ? reject(err) : resolve()));
  });

  const workerClose = Promise.all(workers.map((w) => w.close()));
  const capped = new Promise<void>((r) => setTimeout(r, 10_000));
  await Promise.race([workerClose, capped]);

  await pool.end().catch((err) => logger.error({ err }, "pool.end error"));
  await redisConnection.quit().catch((err) => logger.error({ err }, "redis.quit error"));

  process.exit(0);
}

async function main(): Promise<void> {
  registerWorkers();
  await LeadFollowupQueue.ensureRepeatingScan(config.leadFollowupScanIntervalMs);

  const app = createApp();
  httpServer = createServer(app);

  httpServer.listen(config.port, "0.0.0.0", () => {
    logger.info(
      { port: config.port, env: config.nodeEnv },
      `Revora API listening on port ${config.port}`,
    );
  });

  process.on("SIGINT", () => void shutdown("SIGINT"));
  process.on("SIGTERM", () => void shutdown("SIGTERM"));
}

main().catch((err) => {
  logger.error({ err }, "Fatal startup error");
  process.exit(1);
});

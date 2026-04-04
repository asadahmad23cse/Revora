import type { Request, Response, NextFunction } from "express";
import { checkDatabase } from "../db/pool";
import { redisConnection } from "../queues/connection";
import { getQueueMetricsSnapshot } from "../queues/metrics";

export async function getHealth(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const dbOk = await checkDatabase();
    let redisOk = false;
    try {
      const pong = await redisConnection.ping();
      redisOk = pong === "PONG";
    } catch {
      redisOk = false;
    }

    let queues: Awaited<ReturnType<typeof getQueueMetricsSnapshot>> | null = null;
    let queueMetricsError: string | undefined;
    try {
      queues = await getQueueMetricsSnapshot();
    } catch (e) {
      queues = null;
      queueMetricsError = e instanceof Error ? e.message : String(e);
    }

    const coreOk = dbOk && redisOk;
    const status = coreOk ? 200 : 503;
    res.status(status).json({
      status: coreOk ? "ok" : "degraded",
      checks: {
        database: dbOk,
        redis: redisOk,
        queueMetricsOk: queues !== null,
      },
      queues: queues ?? undefined,
      queueMetricsError,
      timestamp: new Date().toISOString(),
    });
  } catch (e) {
    next(e);
  }
}

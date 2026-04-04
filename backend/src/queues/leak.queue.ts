import { Queue } from "bullmq";
import { redisConnection } from "./connection";
import { QUEUE_LEAK_CALCULATION } from "./queueNames";
import { logger } from "../utils/logger";
import { config } from "../config";
import { defaultQueueJobOptions } from "./defaultJobOptions";

export type LeakJob = { riskEventId: string; aovInr: number };

const queue = new Queue<LeakJob>(QUEUE_LEAK_CALCULATION, {
  connection: redisConnection,
  defaultJobOptions: defaultQueueJobOptions(),
});

export class LeakQueue {
  static async enqueueFinalize(riskEventId: string, aovInr?: number): Promise<void> {
    const aov = aovInr ?? config.defaultAovInr;
    await queue.add("finalize-leak", { riskEventId, aovInr: aov });
    logger.debug({ riskEventId }, "Enqueued leak finalization");
  }
}

export { queue as leakQueue };

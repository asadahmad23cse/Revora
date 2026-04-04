import { Queue } from "bullmq";
import { redisConnection } from "./connection";
import { QUEUE_REPORT_GENERATION } from "./queueNames";
import type { ReportWindow, ReportTrigger } from "../services/report.service";
import { logger } from "../utils/logger";
import { defaultQueueJobOptions } from "./defaultJobOptions";

export type ReportJob = {
  userId: string;
  window: ReportWindow;
  /** When set, workers can log lifecycle-specific messages */
  trigger?: ReportTrigger;
};

const queue = new Queue<ReportJob>(QUEUE_REPORT_GENERATION, {
  connection: redisConnection,
  defaultJobOptions: defaultQueueJobOptions(),
});

export class ReportQueue {
  static async enqueueReport(job: ReportJob): Promise<void> {
    await queue.add("generate-report", job);
    logger.debug({ userId: job.userId, window: job.window }, "Enqueued report generation");
  }
}

export { queue as reportQueue };

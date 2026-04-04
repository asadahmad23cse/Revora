import { Queue } from "bullmq";
import { redisConnection } from "./connection";
import { QUEUE_RISK_EVALUATION } from "./queueNames";
import { logger } from "../utils/logger";
import { defaultQueueJobOptions } from "./defaultJobOptions";

export type RiskEvaluationJobData = {
  incomingMessageId: string;
  thresholdSeconds: number;
  aovInr: number;
};

const queue = new Queue<RiskEvaluationJobData>(QUEUE_RISK_EVALUATION, {
  connection: redisConnection,
  defaultJobOptions: defaultQueueJobOptions(),
});

export class RiskQueue {
  static async scheduleEvaluation(params: RiskEvaluationJobData & { delayMs: number }): Promise<void> {
    const jobId = RiskQueue.jobIdForIncoming(params.incomingMessageId);
    const { delayMs, ...data } = params;
    await queue.add("evaluate-risk", data, {
      jobId,
      delay: delayMs,
    });
    logger.debug({ jobId, delayMs: params.delayMs }, "Scheduled risk evaluation");
  }

  static jobIdForIncoming(incomingMessageId: string): string {
    return `risk-eval:${incomingMessageId}`;
  }

  static async cancelScheduledEvaluation(incomingMessageId: string): Promise<void> {
    const jobId = RiskQueue.jobIdForIncoming(incomingMessageId);
    const job = await queue.getJob(jobId);
    if (job) {
      await job.remove();
      logger.info({ jobId }, "Cancelled scheduled risk evaluation (owner responded)");
    }
  }
}

export { queue as riskEvaluationQueue };

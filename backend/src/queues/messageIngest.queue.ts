import { Queue } from "bullmq";
import { redisConnection } from "./connection";
import { QUEUE_MESSAGE_INGEST } from "./queueNames";
import { logger } from "../utils/logger";
import { defaultQueueJobOptions } from "./defaultJobOptions";

export type MessageIngestJob = {
  messageId: string;
  thresholdSeconds: number;
  aovInr: number;
  /** Optional tenant hint (e.g. /dev/simulate-message); production uses DB resolve from `users`. */
  businessId?: string | null;
};

const queue = new Queue<MessageIngestJob>(QUEUE_MESSAGE_INGEST, {
  connection: redisConnection,
  defaultJobOptions: defaultQueueJobOptions(),
});

export class MessageIngestQueue {
  static async enqueue(job: MessageIngestJob): Promise<void> {
    await queue.add("ingest-message", job, { jobId: `ingest-${job.messageId}` });
    logger.debug({ messageId: job.messageId }, "Enqueued message ingest");
  }
}

export { queue as messageIngestQueue };

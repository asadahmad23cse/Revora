import { Queue } from "bullmq";
import { redisConnection } from "./connection";
import { QUEUE_LEAD_FOLLOWUP } from "./queueNames";
import { defaultQueueJobOptions } from "./defaultJobOptions";

export type LeadFollowupJobData = Record<string, never>;

const queue = new Queue<LeadFollowupJobData>(QUEUE_LEAD_FOLLOWUP, {
  connection: redisConnection,
  defaultJobOptions: defaultQueueJobOptions(),
});

export class LeadFollowupQueue {
  /** Idempotent on restart: fixed jobId for the repeatable scan. */
  static async ensureRepeatingScan(everyMs: number): Promise<void> {
    await queue.add(
      "scan-due-followups",
      {},
      {
        jobId: "revora-lead-followup-recurring",
        repeat: { every: everyMs },
      },
    );
  }
}

export { queue as leadFollowupQueue };

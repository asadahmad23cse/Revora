import { Queue } from "bullmq";
import { redisConnection } from "./connection";
import { QUEUE_DEAD_LETTER } from "./queueNames";
export type DeadLetterJob = {
  sourceQueue: string;
  jobName: string;
  data: unknown;
  failedReason: string;
  attemptsMade: number;
  timestamp: string;
};

export const deadLetterQueue = new Queue<DeadLetterJob>(QUEUE_DEAD_LETTER, {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 1,
    removeOnComplete: 50_000,
    removeOnFail: false,
  },
});

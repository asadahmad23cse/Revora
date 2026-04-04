import type { DefaultJobOptions } from "bullmq";
import { config } from "../config";

export function defaultQueueJobOptions(): DefaultJobOptions {
  return {
    attempts: config.queueMaxAttempts,
    backoff: { type: "exponential", delay: config.queueBackoffMs },
    removeOnComplete: config.queueRemoveOnComplete,
    removeOnFail: config.queueRemoveOnFail,
  };
}

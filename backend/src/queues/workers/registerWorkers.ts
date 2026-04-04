import { Worker, type Job } from "bullmq";
import { redisConnection } from "../connection";
import {
  QUEUE_LEAK_CALCULATION,
  QUEUE_LEAD_FOLLOWUP,
  QUEUE_MESSAGE_INGEST,
  QUEUE_REPORT_GENERATION,
  QUEUE_RISK_EVALUATION,
} from "../queueNames";
import { MessageService } from "../../services/message.service";
import { ResponseTrackingService } from "../../services/responseTracking.service";
import { RiskService } from "../../services/risk.service";
import { RiskQueue } from "../risk.queue";
import { hasFoodOrOrderIntent } from "../../utils/foodKeywords";
import { LeakService } from "../../services/leak.service";
import { ReportService } from "../../services/report.service";
import { logger } from "../../utils/logger";
import { deadLetterQueue } from "../deadLetter.queue";
import { ConversationLockService } from "../../services/conversationLock.service";
import { pool } from "../../db/pool";
import { FunnelLifecycleService } from "../../services/funnelLifecycle.service";
import { LeadService } from "../../services/lead.service";

export const workers: Worker[] = [];

function attachDlq(worker: Worker, sourceQueueName: string): void {
  worker.on("failed", (job: Job | undefined, err: Error) => {
    if (!job) return;
    const max = job.opts.attempts ?? 1;
    if (job.attemptsMade < max) return;
    const failedReason = err?.message ?? String(err);
    void deadLetterQueue
      .add(
        "dead",
        {
          sourceQueue: sourceQueueName,
          jobName: job.name ?? "unknown",
          data: job.data,
          failedReason,
          attemptsMade: job.attemptsMade,
          timestamp: new Date().toISOString(),
        },
        { removeOnComplete: 50_000 },
      )
      .catch((e) => {
        logger.error({ err: e }, "Failed to enqueue dead-letter job");
      });
    logger.error(
      {
        sourceQueueName,
        jobId: job.id,
        failedReason,
        attemptsMade: job.attemptsMade,
      },
      "Job exhausted retries — recorded in dead-letter queue",
    );
  });
}

export function registerWorkers(): void {
  const ingest = new Worker(
    QUEUE_MESSAGE_INGEST,
    async (job) => {
      const { messageId, thresholdSeconds, aovInr } = job.data;
      const msg = await MessageService.getById(messageId);
      if (!msg) {
        logger.warn({ messageId }, "Ingest: message not found");
        return;
      }
      const lock = await ConversationLockService.acquire(msg.user_id, msg.phone_number);
      if (!lock) {
        throw new Error("conversation_lock_busy");
      }
      try {
        if (msg.direction === "outgoing") {
          await ResponseTrackingService.recordOwnerReplyForOutgoingMessage(messageId, thresholdSeconds);
          return;
        }
        if (msg.direction === "incoming" && hasFoodOrOrderIntent(msg.message_text)) {
          await RiskQueue.scheduleEvaluation({
            incomingMessageId: messageId,
            delayMs: thresholdSeconds * 1000,
            thresholdSeconds,
            aovInr,
          });
          logger.info({ messageId, thresholdSeconds }, "Scheduled delayed risk evaluation");
        }
      } finally {
        await ConversationLockService.release(lock);
      }
    },
    { connection: redisConnection, concurrency: 32 },
  );
  workers.push(ingest);
  attachDlq(ingest, QUEUE_MESSAGE_INGEST);

  const risk = new Worker(
    QUEUE_RISK_EVALUATION,
    async (job) => {
      const { incomingMessageId, thresholdSeconds, aovInr } = job.data;
      const msg = await MessageService.getById(incomingMessageId);
      if (!msg) {
        logger.warn({ incomingMessageId }, "Risk job: incoming message missing");
        return;
      }
      const lock = await ConversationLockService.acquire(msg.user_id, msg.phone_number);
      if (!lock) {
        throw new Error("conversation_lock_busy");
      }
      try {
        const result = await RiskService.evaluateDelayedResponse({
          incomingMessageId,
          thresholdSeconds,
          aovInr,
        });
        logger.info({ incomingMessageId, result }, "Risk evaluation finished");
      } finally {
        await ConversationLockService.release(lock);
      }
    },
    { connection: redisConnection, concurrency: 24 },
  );
  workers.push(risk);
  attachDlq(risk, QUEUE_RISK_EVALUATION);

  const leak = new Worker(
    QUEUE_LEAK_CALCULATION,
    async (job) => {
      await LeakService.finalizeRiskEvent(job.data.riskEventId, job.data.aovInr);
    },
    { connection: redisConnection, concurrency: 8 },
  );
  workers.push(leak);
  attachDlq(leak, QUEUE_LEAK_CALCULATION);

  const report = new Worker(
    QUEUE_REPORT_GENERATION,
    async (job) => {
      const trigger = job.data.trigger;
      const reportResult = await ReportService.generate(job.data);
      const firstReport = await FunnelLifecycleService.touchFirstReportGeneratedAt(pool, reportResult.userId);
      if (firstReport) {
        logger.info(
          {
            userId: reportResult.userId,
            window: reportResult.window,
            trigger,
            firstReportForUser: true,
          },
          "First report generated for user (funnel lifecycle)",
        );
      }
      logger.info(
        {
          userId: reportResult.userId,
          window: reportResult.window,
          trigger,
          summary: reportResult.summary,
        },
        "Report job completed",
      );
    },
    { connection: redisConnection, concurrency: 4 },
  );
  workers.push(report);
  attachDlq(report, QUEUE_REPORT_GENERATION);

  const leadFollowup = new Worker(
    QUEUE_LEAD_FOLLOWUP,
    async () => {
      const due = await LeadService.findDueForFollowupScan();
      for (const row of due) {
        const bumped = await LeadService.bumpFollowupFromScan(row.id);
        if (bumped) {
          logger.info(
            {
              leadId: row.id,
              phone: row.phone_number,
              status: row.status,
              followupCount: bumped.followup_count,
            },
            "Follow-up triggered (scheduled scan)",
          );
        }
      }
    },
    { connection: redisConnection, concurrency: 1 },
  );
  workers.push(leadFollowup);
  attachDlq(leadFollowup, QUEUE_LEAD_FOLLOWUP);
}

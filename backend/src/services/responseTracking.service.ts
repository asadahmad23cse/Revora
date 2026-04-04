import type { PoolClient, Pool } from "pg";
import { pool } from "../db/pool";
import { logger } from "../utils/logger";
import { MessageService } from "./message.service";
import { RiskQueue } from "../queues/risk.queue";

export class ResponseTrackingService {
  /**
   * Links the most recent unanswered incoming (before outgoing ts) to this outgoing leg.
   * Idempotent per incoming message_id.
   */
  static async recordOwnerReplyForOutgoingMessage(
    outgoingMessageId: string,
    thresholdSeconds: number,
    client?: PoolClient | Pool,
  ): Promise<void> {
    const db = client ?? pool;
    const msg = await MessageService.getById(outgoingMessageId, db);
    if (!msg || msg.direction !== "outgoing") {
      logger.warn({ outgoingMessageId }, "recordOwnerReplyForOutgoingMessage: not an outgoing message");
      return;
    }

    const incoming = await db.query<{ id: string; timestamp: Date }>(
      `SELECT id, "timestamp"
       FROM messages
       WHERE user_id = $1
         AND phone_number = $2
         AND direction = 'incoming'
         AND "timestamp" < $3
         AND NOT EXISTS (SELECT 1 FROM response_tracking r WHERE r.message_id = messages.id)
       ORDER BY "timestamp" ASC
       LIMIT 1`,
      [msg.user_id, msg.phone_number, msg.timestamp.toISOString()],
    );

    const inc = incoming.rows[0];
    if (!inc) {
      logger.debug({ outgoingMessageId }, "No pending incoming to pair for outgoing");
      return;
    }

    const delaySec = Math.max(
      0,
      Math.floor((msg.timestamp.getTime() - new Date(inc.timestamp).getTime()) / 1000),
    );
    const isDelayed = delaySec > thresholdSeconds;

    await db.query(
      `INSERT INTO response_tracking (message_id, response_time_seconds, is_delayed)
       VALUES ($1, $2, $3)
       ON CONFLICT (message_id) DO NOTHING`,
      [inc.id, delaySec, isDelayed],
    );

    logger.info(
      {
        incomingMessageId: inc.id,
        outgoingMessageId,
        responseTimeSeconds: delaySec,
        isDelayed,
      },
      "Response tracking recorded",
    );

    await RiskQueue.cancelScheduledEvaluation(inc.id);
  }
}

import { pool } from "../db/pool";
import { logger } from "../utils/logger";
import { hasFoodOrOrderIntent } from "../utils/foodKeywords";
import { MessageService } from "./message.service";
import type { RiskType } from "../types";
import { LeakQueue } from "../queues/leak.queue";

export class RiskService {
  /**
   * After threshold: if food intent incoming still has no owner reply in time → at-risk event.
   * Race-safe with DB constraints and post-check for outgoing.
   */
  static async evaluateDelayedResponse(params: {
    incomingMessageId: string;
    thresholdSeconds: number;
    aovInr: number;
  }): Promise<{ created: boolean; reason?: string }> {
    const msg = await MessageService.getById(params.incomingMessageId);
    if (!msg || msg.direction !== "incoming") {
      return { created: false, reason: "not_incoming" };
    }

    if (!hasFoodOrOrderIntent(msg.message_text)) {
      return { created: false, reason: "no_food_intent" };
    }

    const rt = await pool.query(`SELECT 1 FROM response_tracking WHERE message_id = $1`, [msg.id]);
    if (rt.rowCount && rt.rowCount > 0) {
      return { created: false, reason: "already_answered" };
    }

    const hasReply = await MessageService.hasOutgoingAfter({
      userId: msg.user_id,
      customerPhone: msg.phone_number,
      after: msg.timestamp,
    });

    if (hasReply) {
      return { created: false, reason: "reply_exists" };
    }

    const riskType: RiskType = "no_response_within_threshold";
    const confidence = 0.72;
    const reason =
      `Food/order intent detected; no owner response within ${params.thresholdSeconds}s (at-risk estimate only).`;

    try {
      const ins = await pool.query<{ id: string }>(
        `INSERT INTO risk_events (message_id, risk_type, estimated_loss, confidence, reason)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (message_id) DO NOTHING
         RETURNING id`,
        [msg.id, riskType, params.aovInr, confidence, reason],
      );

      const riskRow = ins.rows[0];
      if (!riskRow) {
        logger.info({ messageId: msg.id }, "Risk event already present (idempotent)");
        return { created: false, reason: "duplicate_risk" };
      }

      logger.warn({ riskEventId: riskRow.id, messageId: msg.id }, "Risk event created — revenue at risk (not confirmed lost)");

      await LeakQueue.enqueueFinalize(riskRow.id);

      return { created: true, reason: riskType };
    } catch (e) {
      logger.error({ err: e, messageId: msg.id }, "Failed to insert risk event");
      throw e;
    }
  }
}

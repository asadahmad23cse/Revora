import { pool } from "../db/pool";
import { config } from "../config";
import { logger } from "../utils/logger";

/**
 * Async refinement step for estimated at-risk amounts (Phase 1: applies global AOV + tightens confidence band).
 */
export class LeakService {
  static async finalizeRiskEvent(riskEventId: string, aovInr?: number): Promise<void> {
    const aov = aovInr ?? config.defaultAovInr;
    const r = await pool.query(
      `UPDATE risk_events
       SET estimated_loss = $2,
           confidence = LEAST(GREATEST(confidence, 0.68), 0.82)
       WHERE id = $1`,
      [riskEventId, aov],
    );
    if (r.rowCount === 0) {
      logger.warn({ riskEventId }, "finalizeRiskEvent: risk row not found");
      return;
    }
    logger.info({ riskEventId, aov }, "Leak calculation finalized (at-risk estimate)");
  }
}

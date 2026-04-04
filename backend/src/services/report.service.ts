import { pool } from "../db/pool";
import { logger } from "../utils/logger";

export type ReportWindow = "daily" | "14days";

export type ReportResult = {
  userId: string;
  window: ReportWindow;
  periodStart: Date;
  periodEnd: Date;
  totalRiskyMessages: number;
  totalEstimatedRevenueAtRiskInr: string;
  averageResponseTimeSeconds: number | null;
  summary: string;
};

function startOfWindow(now: Date, window: ReportWindow): Date {
  const d = new Date(now.getTime());
  if (window === "daily") {
    d.setTime(d.getTime() - 24 * 60 * 60 * 1000);
    return d;
  }
  d.setTime(d.getTime() - 14 * 24 * 60 * 60 * 1000);
  return d;
}

export class ReportService {
  static async generate(params: { userId: string; window: ReportWindow }): Promise<ReportResult> {
    const now = new Date();
    const start = startOfWindow(now, params.window);
    const userCheck = await pool.query(`SELECT id FROM users WHERE id = $1`, [params.userId]);
    if (!userCheck.rowCount) {
      throw new Error("User not found");
    }

    const risky = await pool.query<{ c: string; total: string }>(
      `SELECT
        COUNT(*)::text AS c,
        COALESCE(SUM(re.estimated_loss), 0)::text AS total
       FROM risk_events re
       INNER JOIN messages m ON m.id = re.message_id
       WHERE m.user_id = $1
         AND re.created_at >= $2
         AND re.created_at <= $3`,
      [params.userId, start.toISOString(), now.toISOString()],
    );

    const totalRiskyMessages = Number(risky.rows[0]?.c ?? "0");
    const totalAtRisk = risky.rows[0]?.total ?? "0";

    const avgRt = await pool.query<{ avg: string | null }>(
      `SELECT AVG(rt.response_time_seconds)::text AS avg
       FROM response_tracking rt
       INNER JOIN messages m ON m.id = rt.message_id
       WHERE m.user_id = $1
         AND rt.created_at >= $2
         AND rt.created_at <= $3`,
      [params.userId, start.toISOString(), now.toISOString()],
    );

    const avgStr = avgRt.rows[0]?.avg;
    const averageResponseTimeSeconds =
      avgStr !== null && avgStr !== undefined && avgStr !== "" ? Number(avgStr) : null;

    const roundedAtRisk = Math.round(Number(totalAtRisk));
    const daysLabel = params.window === "daily" ? "last 24 hours" : "last 14 days";

    const summaryParts = [
      `You had ${totalRiskyMessages} delayed or missed responses in the ${daysLabel}.`,
      `At least ₹${roundedAtRisk.toLocaleString("en-IN")} in revenue was at risk.`,
    ];
    if (averageResponseTimeSeconds !== null && Number.isFinite(averageResponseTimeSeconds)) {
      summaryParts.push(`Average response time was ${Math.round(averageResponseTimeSeconds)} seconds.`);
    }

    const summary = summaryParts.join(" ");

    logger.info({ userId: params.userId, window: params.window, totalRiskyMessages }, "Report generated");

    return {
      userId: params.userId,
      window: params.window,
      periodStart: start,
      periodEnd: now,
      totalRiskyMessages,
      totalEstimatedRevenueAtRiskInr: totalAtRisk,
      averageResponseTimeSeconds:
        averageResponseTimeSeconds !== null && Number.isFinite(averageResponseTimeSeconds)
          ? averageResponseTimeSeconds
          : null,
      summary,
    };
  }
}

import { pool } from "../db/pool";
import { config } from "../config";
import { logger } from "../utils/logger";
import { sendTextMessage } from "./whatsapp";
import { sendTelegramTextMessage } from "./telegram";

export type ReportWindow = "daily" | "14days";

export type ReportTrigger = "manual_api" | "auto_first_incoming_threshold";

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

const WHATSAPP_14D_REPORT_MARKER = "📊 Aapki 14-Din Revenue Report";

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
  /** Maps `businesses.id` to WhatsApp tenant `users.id` when `phone_number` matches. */
  static async resolveWhatsAppUserIdForBusiness(businessId: string): Promise<string | null> {
    const r = await pool.query<{ id: string }>(
      `SELECT u.id
       FROM businesses b
       INNER JOIN users u ON u.phone_number = b.phone_number
       WHERE b.id = $1
       LIMIT 1`,
      [businessId],
    );
    return r.rows[0]?.id ?? null;
  }

  /** True when an outgoing report marker already exists for today (Asia/Kolkata). */
  private static async was14DayReportSentToday(userId: string): Promise<boolean> {
    const r = await pool.query<{ one: number }>(
      `SELECT 1 AS one
       FROM messages
       WHERE user_id = $1
         AND direction = 'outgoing'
         AND message_text LIKE '%' || $2 || '%'
         AND date_trunc('day', "timestamp" AT TIME ZONE 'Asia/Kolkata')
             = date_trunc('day', now() AT TIME ZONE 'Asia/Kolkata')
       LIMIT 1`,
      [userId, WHATSAPP_14D_REPORT_MARKER],
    );
    return r.rows.length > 0;
  }

  /** Metrics for the Hindi 14-day WhatsApp digest (totals, >90m replies, peak delayed share). */
  private static async fetch14DayWhatsAppDigest(params: {
    userId: string;
    periodStart: Date;
    periodEnd: Date;
  }): Promise<{
    totalMessages: number;
    unansweredOver90Min: number;
    peakMissPercent: number;
  }> {
    const { userId, periodStart, periodEnd } = params;
    const bounds = [userId, periodStart.toISOString(), periodEnd.toISOString()];

    const total = await pool.query<{ c: string }>(
      `SELECT COUNT(*)::text AS c
       FROM messages
       WHERE user_id = $1 AND "timestamp" >= $2 AND "timestamp" <= $3`,
      bounds,
    );

    const unanswered = await pool.query<{ c: string }>(
      `SELECT COUNT(*)::text AS c
       FROM response_tracking rt
       INNER JOIN messages m ON m.id = rt.message_id
       WHERE m.user_id = $1
         AND m.direction = 'incoming'
         AND m."timestamp" >= $2
         AND m."timestamp" <= $3
         AND rt.response_time_seconds > 5400`,
      bounds,
    );

    const peak = await pool.query<{ peak: string | null; total: string | null }>(
      `SELECT
         COUNT(*) FILTER (WHERE
           EXTRACT(HOUR FROM (m."timestamp" AT TIME ZONE 'Asia/Kolkata')) >= 11
           AND EXTRACT(HOUR FROM (m."timestamp" AT TIME ZONE 'Asia/Kolkata')) < 13
         )::text AS peak,
         COUNT(*)::text AS total
       FROM messages m
       INNER JOIN response_tracking rt ON rt.message_id = m.id
       WHERE m.user_id = $1
         AND m.direction = 'incoming'
         AND m."timestamp" >= $2
         AND m."timestamp" <= $3
         AND rt.response_time_seconds > 5400`,
      bounds,
    );

    const peakN = Number(peak.rows[0]?.peak ?? "0");
    const totalDelayed = Number(peak.rows[0]?.total ?? "0");
    const peakMissPercent =
      totalDelayed > 0 ? Math.min(100, Math.round((peakN / totalDelayed) * 100)) : 0;

    return {
      totalMessages: Number(total.rows[0]?.c ?? "0"),
      unansweredOver90Min: Number(unanswered.rows[0]?.c ?? "0"),
      peakMissPercent,
    };
  }

  /** Sends the fixed-format 14-day Hindi report via configured provider once per India-local day when possible. */
  static async deliver14DayReport(result: ReportResult): Promise<void> {
    if (result.window !== "14days") return;
    try {
      const already = await ReportService.was14DayReportSentToday(result.userId);
      if (already) {
        logger.info({ userId: result.userId }, "14d report: already sent today; skip");
        return;
      }

      const digest = await ReportService.fetch14DayWhatsAppDigest({
        userId: result.userId,
        periodStart: result.periodStart,
        periodEnd: result.periodEnd,
      });

      const est = Math.round(Number(result.totalEstimatedRevenueAtRiskInr));
      const avgMins =
        result.averageResponseTimeSeconds !== null && Number.isFinite(result.averageResponseTimeSeconds)
          ? Math.round(result.averageResponseTimeSeconds / 60)
          : 0;

      const text = `━━━━━━━━━━━━━━━━━━━━━
${WHATSAPP_14D_REPORT_MARKER}
━━━━━━━━━━━━━━━━━━━━━

Kul messages mile: ${digest.totalMessages.toLocaleString("en-IN")}
90 min mein jawab nahi diya: ${digest.unansweredOver90Min.toLocaleString("en-IN")}
Estimated revenue at risk: ₹${est.toLocaleString("en-IN")}

Aapka avg response time: ${avgMins.toLocaleString("en-IN")} min
Peak hours mein missed (11am-1pm): ${digest.peakMissPercent.toLocaleString("en-IN")}%

Is leak ko rokna chahte ho?
Reply karo: HAAN

━━━━━━━━━━━━━━━━━━━━━`;

      if (config.messagingProvider === "telegram") {
        const chatId = config.telegramOwnerChatId;
        if (!chatId) {
          logger.info({ userId: result.userId }, "14d Telegram report: TELEGRAM_OWNER_CHAT_ID not configured; skip");
          return;
        }
        await sendTelegramTextMessage(chatId, text, result.userId);
        return;
      }

      const user = await pool.query<{ phone_number: string }>(
        `SELECT phone_number FROM users WHERE id = $1 LIMIT 1`,
        [result.userId],
      );
      const phone = user.rows[0]?.phone_number?.trim();
      if (!phone) {
        logger.info({ userId: result.userId }, "14d WhatsApp report: no owner phone; skip");
        return;
      }
      await sendTextMessage(phone, text);
    } catch (e) {
      logger.error({ err: e, userId: result.userId }, "14d report delivery failed");
    }
  }

  static async generate(params: {
    userId: string;
    window: ReportWindow;
    trigger?: ReportTrigger;
  }): Promise<ReportResult> {
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

    logger.info(
      {
        userId: params.userId,
        window: params.window,
        trigger: params.trigger,
        totalRiskyMessages,
      },
      "Report generated",
    );

    const reportResult: ReportResult = {
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

    if (params.window === "14days") {
      void ReportService.deliver14DayReport(reportResult).catch((err) => {
        logger.error(
          { err, userId: params.userId },
          "14d report delivery rejected unexpectedly",
        );
      });
    }

    return reportResult;
  }
}

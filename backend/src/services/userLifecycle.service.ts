import { pool } from "../db/pool";
import type { PoolClient } from "pg";
import { config } from "../config";
import { logger } from "../utils/logger";
import { ReportQueue } from "../queues/report.queue";

function lifecycleHasFirstReport(cfg: unknown): boolean {
  if (!cfg || typeof cfg !== "object") return false;
  const lifecycle = (cfg as Record<string, unknown>).lifecycle;
  if (!lifecycle || typeof lifecycle !== "object") return false;
  const v = (lifecycle as Record<string, unknown>).first_report_enqueued_at;
  return v !== undefined && v !== null && String(v).length > 0;
}

/**
 * After a new inbound message row is committed: activate onboarded users & optionally
 * enqueue the first automated 14-day report once the inbound count crosses the threshold.
 */
export class UserLifecycleService {
  static async afterIncomingMessagePersisted(params: {
    userId: string;
    messageId: string;
    inserted: boolean;
  }): Promise<void> {
    if (!params.inserted) return;

    const runTx = async (client: PoolClient) => {
      const u = await client.query<{ id: string; status: string; config: unknown }>(
        `SELECT id, status, config FROM users WHERE id = $1 FOR UPDATE`,
        [params.userId],
      );
      const row = u.rows[0];
      if (!row) return;

      if (row.status === "onboarded") {
        const act = await client.query<{ id: string }>(
          `UPDATE users SET
            status = 'active',
            config = jsonb_set(
              COALESCE(config, '{}'::jsonb),
              '{onboarding,connection_pending}',
              'false'::jsonb,
              true
            )
          WHERE id = $1 AND status = 'onboarded'
          RETURNING id`,
          [params.userId],
        );
        if (act.rows[0]) {
          logger.info(
            { userId: params.userId, messageId: params.messageId },
            "First inbound message received; user activation completed (onboarded → active)",
          );
        }
      }

      const refreshed = await client.query<{ config: unknown }>(
        `SELECT config FROM users WHERE id = $1`,
        [params.userId],
      );
      const cfg = refreshed.rows[0]?.config;
      if (lifecycleHasFirstReport(cfg)) {
        return;
      }

      const cr = await client.query<{ c: string }>(
        `SELECT COUNT(*)::text AS c FROM messages WHERE user_id = $1 AND direction = 'incoming'`,
        [params.userId],
      );
      const incomingCount = Number(cr.rows[0]?.c ?? "0");
      const threshold = config.firstReportIncomingMessageThreshold;
      if (incomingCount < threshold) {
        return;
      }

      const marked = await client.query<{ id: string }>(
        `UPDATE users
         SET config = jsonb_set(
           COALESCE(config, '{}'::jsonb),
           '{lifecycle}',
           COALESCE(config->'lifecycle', '{}'::jsonb)
             || jsonb_build_object('first_report_enqueued_at', to_jsonb(now())),
           true
         )
         WHERE id = $1
           AND (config->'lifecycle'->>'first_report_enqueued_at') IS NULL
         RETURNING id`,
        [params.userId],
      );

      if (!marked.rows[0]) {
        return;
      }

      await ReportQueue.enqueueReport({
        userId: params.userId,
        window: "14days",
        trigger: "auto_first_incoming_threshold",
      });

      logger.info(
        {
          userId: params.userId,
          incomingCount,
          threshold,
          trigger: "auto_first_incoming_threshold",
        },
        "First report generation enqueued after inbound message threshold",
      );
    };

    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await runTx(client);
      await client.query("COMMIT");
    } catch (e) {
      try {
        await client.query("ROLLBACK");
      } catch {
        /* ignore */
      }
      logger.error({ err: e, userId: params.userId }, "User lifecycle transaction failed");
      throw e;
    } finally {
      client.release();
    }
  }
}

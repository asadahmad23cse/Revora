import type { Pool, PoolClient } from "pg";

type Db = Pool | PoolClient;

/**
 * Writes one-time funnel timestamps under users.config.lifecycle (ISO timestamps).
 */
export class FunnelLifecycleService {
  static async touchOnboardingCreatedAt(db: Db, userId: string): Promise<void> {
    await db.query(
      `UPDATE users SET config = jsonb_set(
         COALESCE(config, '{}'::jsonb),
         '{lifecycle}',
         COALESCE(config->'lifecycle', '{}'::jsonb)
           || jsonb_build_object('onboarding_created_at', to_jsonb(now())),
         true
       )
       WHERE id = $1 AND (config->'lifecycle'->>'onboarding_created_at') IS NULL`,
      [userId],
    );
  }

  /** @returns true if timestamp was newly set */
  static async touchFirstMessageReceivedAt(db: Db, userId: string): Promise<boolean> {
    const r = await db.query<{ id: string }>(
      `UPDATE users SET config = jsonb_set(
         COALESCE(config, '{}'::jsonb),
         '{lifecycle}',
         COALESCE(config->'lifecycle', '{}'::jsonb)
           || jsonb_build_object('first_message_received_at', to_jsonb(now())),
         true
       )
       WHERE id = $1 AND (config->'lifecycle'->>'first_message_received_at') IS NULL
       RETURNING id`,
      [userId],
    );
    return Boolean(r.rows[0]);
  }

  /** @returns true if timestamp was newly set */
  static async touchUserActivatedAt(db: Db, userId: string): Promise<boolean> {
    const r = await db.query<{ id: string }>(
      `UPDATE users SET config = jsonb_set(
         COALESCE(config, '{}'::jsonb),
         '{lifecycle}',
         COALESCE(config->'lifecycle', '{}'::jsonb)
           || jsonb_build_object('user_activated_at', to_jsonb(now())),
         true
       )
       WHERE id = $1 AND (config->'lifecycle'->>'user_activated_at') IS NULL
       RETURNING id`,
      [userId],
    );
    return Boolean(r.rows[0]);
  }

  /** @returns true if this run set the timestamp (first report for user). */
  static async touchFirstReportGeneratedAt(db: Db, userId: string): Promise<boolean> {
    const r = await db.query<{ id: string }>(
      `UPDATE users SET config = jsonb_set(
         COALESCE(config, '{}'::jsonb),
         '{lifecycle}',
         COALESCE(config->'lifecycle', '{}'::jsonb)
           || jsonb_build_object('first_report_generated_at', to_jsonb(now())),
         true
       )
       WHERE id = $1 AND (config->'lifecycle'->>'first_report_generated_at') IS NULL
       RETURNING id`,
      [userId],
    );
    return Boolean(r.rows[0]);
  }
}

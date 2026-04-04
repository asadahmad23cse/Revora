import { pool } from "../db/pool";

export type AcquisitionMetrics = {
  total_leads: number;
  /** Lead rows by key funnel statuses */
  funnel: {
    leads: number;
    leads_onboarded: number;
    leads_active: number;
    leads_dropped: number;
  };
  /** Application users (tenant) counts */
  users: {
    onboarded: number;
    active: number;
  };
  /** Leads that reached status active / total leads */
  conversion_rate_percent: number;
  /** Leads marked dropped / total leads */
  drop_rate_percent: number;
  /** Mean hours from lifecycle.onboarding_created_at → user_activated_at for active users (null if none). */
  avg_time_to_activation_hours: number | null;
};

/**
 * Acquisition + conversion metrics (leads table + users.config.lifecycle).
 */
export class MetricsService {
  static async getAcquisition(): Promise<AcquisitionMetrics> {
    const agg = await pool.query<{
      total_leads: string;
      leads_onboarded: string;
      leads_active: string;
      leads_dropped: string;
      users_onboarded: string;
      users_active: string;
      avg_hours: string | null;
    }>(
      `SELECT
        (SELECT COUNT(*)::text FROM leads) AS total_leads,
        (SELECT COUNT(*)::text FROM leads WHERE status = 'onboarded') AS leads_onboarded,
        (SELECT COUNT(*)::text FROM leads WHERE status = 'active') AS leads_active,
        (SELECT COUNT(*)::text FROM leads WHERE status = 'dropped') AS leads_dropped,
        (SELECT COUNT(*)::text FROM users WHERE status = 'onboarded') AS users_onboarded,
        (SELECT COUNT(*)::text FROM users WHERE status = 'active') AS users_active,
        (
          SELECT AVG(
            EXTRACT(
              EPOCH FROM (
                (config #>> '{lifecycle,user_activated_at}')::timestamptz
                - (config #>> '{lifecycle,onboarding_created_at}')::timestamptz
              )
            ) / 3600.0
          )::text
          FROM users
          WHERE status = 'active'
            AND (config #>> '{lifecycle,user_activated_at}') IS NOT NULL
            AND (config #>> '{lifecycle,onboarding_created_at}') IS NOT NULL
        ) AS avg_hours`,
    );

    const row = agg.rows[0];
    const total_leads = Number(row?.total_leads ?? "0");
    const leads_onboarded = Number(row?.leads_onboarded ?? "0");
    const leads_active = Number(row?.leads_active ?? "0");
    const leads_dropped = Number(row?.leads_dropped ?? "0");
    const users_onboarded = Number(row?.users_onboarded ?? "0");
    const users_active = Number(row?.users_active ?? "0");

    const conversion_rate_percent =
      total_leads > 0 ? Math.round((10000 * leads_active) / total_leads) / 100 : 0;
    const drop_rate_percent =
      total_leads > 0 ? Math.round((10000 * leads_dropped) / total_leads) / 100 : 0;

    const avgRaw = row?.avg_hours;
    const avg_time_to_activation_hours =
      avgRaw !== null && avgRaw !== undefined && avgRaw !== ""
        ? Math.round(Number(avgRaw) * 100) / 100
        : null;

    return {
      total_leads,
      funnel: {
        leads: total_leads,
        leads_onboarded,
        leads_active,
        leads_dropped,
      },
      users: {
        onboarded: users_onboarded,
        active: users_active,
      },
      conversion_rate_percent,
      drop_rate_percent,
      avg_time_to_activation_hours,
    };
  }
}

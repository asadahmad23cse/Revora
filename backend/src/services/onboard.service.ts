import { pool } from "../db/pool";
import { UserService } from "./user.service";
import { logger } from "../utils/logger";
import { HttpError } from "../middlewares/httpError";
import { LeadService, type LeadSource } from "./lead.service";
import { FunnelLifecycleService } from "./funnelLifecycle.service";

export class OnboardService {
  /**
   * Creates or updates the business row for this signup (owner phone),
   * records funnel + lead row for acquisition tracking.
   */
  static async createOrUpdateOwner(params: {
    name: string;
    phone: string;
    source: LeadSource;
  }): Promise<{ userId: string }> {
    const phone = UserService.normalizePhone(params.phone);
    const name = params.name.trim();
    if (!phone || phone.length < 8) {
      throw new HttpError(400, "Invalid phone number", "invalid_phone");
    }

    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const r = await client.query<{ id: string }>(
        `INSERT INTO users (phone_number, display_name, status, config)
         VALUES (
           $1, $2, 'onboarded',
           jsonb_build_object(
             'onboarding',
             jsonb_build_object('connection_pending', true, 'onboarded_at', to_jsonb(now()))
           )
         )
         ON CONFLICT (phone_number) DO UPDATE SET
           display_name = COALESCE(EXCLUDED.display_name, users.display_name),
           phone_number = EXCLUDED.phone_number,
           status = CASE WHEN users.status = 'active' THEN users.status ELSE 'onboarded' END,
           config = CASE
             WHEN users.status = 'active' THEN users.config
             ELSE users.config
               || jsonb_build_object(
                    'onboarding',
                    COALESCE(users.config->'onboarding', '{}'::jsonb)
                      || jsonb_build_object('connection_pending', true, 'onboarded_at', to_jsonb(now()))
                  )
           END
         RETURNING id`,
        [phone, name],
      );
      const row = r.rows[0];
      if (!row) {
        throw new HttpError(500, "Onboard insert failed", "onboard_failed");
      }

      await FunnelLifecycleService.touchOnboardingCreatedAt(client, row.id);
      await LeadService.upsertFromOnboard(client, {
        userId: row.id,
        name,
        phone,
        source: params.source,
      });

      await client.query("COMMIT");

      logger.info(
        { userId: row.id, phone, status: "onboarded", connectionPending: true, source: params.source },
        "Onboarding created; WhatsApp connection simulated as pending until first inbound message",
      );
      return { userId: row.id };
    } catch (e) {
      try {
        await client.query("ROLLBACK");
      } catch {
        /* ignore */
      }
      throw e;
    } finally {
      client.release();
    }
  }
}

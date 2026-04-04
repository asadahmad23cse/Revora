import type { Pool, PoolClient } from "pg";
import { pool } from "../db/pool";
import { logger } from "../utils/logger";

export type LeadSource = "instagram" | "whatsapp" | "manual";
export type LeadStatus =
  | "new"
  | "contacted"
  | "onboarded"
  | "interested"
  | "trial"
  | "active"
  | "dropped";
export type IntentTag = "high_intent" | "low_intent";

const LEAD_COLUMNS = `id, name, phone_number, source, status, intent_tag, notes, user_id,
  business_id, email,
  last_contacted_at, next_followup_at, followup_count, created_at, updated_at`;

export type LeadRow = {
  id: string;
  name: string;
  phone_number: string;
  source: LeadSource;
  status: LeadStatus;
  intent_tag: IntentTag | null;
  notes: string | null;
  user_id: string | null;
  business_id: string | null;
  email: string | null;
  last_contacted_at: Date | null;
  next_followup_at: Date | null;
  followup_count: number;
  created_at: Date;
  updated_at: Date;
};

export type LeadTenantAccess = { ok: true; lead: LeadRow } | { ok: false; reason: "not_found" | "forbidden" };

type Db = Pool | PoolClient;

export class LeadService {
  static normalizeSource(raw: string | undefined): LeadSource {
    if (raw === "instagram" || raw === "whatsapp" || raw === "manual") return raw;
    return "manual";
  }

  /** ≤24h from onboarding_created_at to user_activated_at → high intent. */
  static intentFromLifecycleConfig(config: unknown): IntentTag {
    if (!config || typeof config !== "object") return "low_intent";
    const lc = (config as Record<string, unknown>).lifecycle;
    if (!lc || typeof lc !== "object") return "low_intent";
    const o = (lc as Record<string, unknown>).onboarding_created_at;
    const a = (lc as Record<string, unknown>).user_activated_at;
    const t0 =
      typeof o === "string"
        ? Date.parse(o)
        : o instanceof Date
          ? o.getTime()
          : typeof o === "number"
            ? o
            : NaN;
    const t1 =
      typeof a === "string"
        ? Date.parse(a)
        : a instanceof Date
          ? a.getTime()
          : typeof a === "number"
            ? a
            : NaN;
    if (!Number.isFinite(t0) || !Number.isFinite(t1)) return "low_intent";
    const hours = (t1 - t0) / (3600 * 1000);
    return hours <= 24 ? "high_intent" : "low_intent";
  }

  /** Upsert by phone: landing onboard marks row onboarded and links user_id. */
  static async upsertFromOnboard(
    db: Db,
    params: {
      userId: string;
      name: string;
      phone: string;
      source: LeadSource;
      businessId?: string | null;
      email?: string | null;
    },
  ): Promise<{ leadId: string }> {
    const businessId = params.businessId ?? null;
    const email = params.email ?? null;
    const r = await db.query<{ id: string }>(
      `INSERT INTO leads (name, phone_number, source, status, user_id, business_id, email)
       VALUES ($1, $2, $3, 'onboarded', $4, $5, $6)
       ON CONFLICT (phone_number) DO UPDATE SET
         name = EXCLUDED.name,
         user_id = EXCLUDED.user_id,
         source = EXCLUDED.source,
         status = 'onboarded',
         business_id = COALESCE(EXCLUDED.business_id, leads.business_id),
         email = COALESCE(EXCLUDED.email, leads.email),
         updated_at = now()
       RETURNING id`,
      [params.name.trim(), params.phone, params.source, params.userId, businessId, email],
    );
    const id = r.rows[0]?.id;
    if (!id) throw new Error("Lead upsert failed");
    logger.info(
      { leadId: id, userId: params.userId, phone: params.phone, source: params.source, status: "onboarded" },
      "Lead created or updated from onboarding",
    );
    return { leadId: id };
  }

  static async markActiveByUserId(db: Db, userId: string): Promise<void> {
    const cfgR = await db.query<{ config: unknown }>(`SELECT config FROM users WHERE id = $1`, [userId]);
    const intent = LeadService.intentFromLifecycleConfig(cfgR.rows[0]?.config);
    const r = await db.query<{ id: string }>(
      `UPDATE leads
       SET status = 'active', intent_tag = $2, updated_at = now()
       WHERE user_id = $1 AND status <> 'active'
       RETURNING id`,
      [userId, intent],
    );
    const leadId = r.rows[0]?.id;
    if (leadId) {
      logger.info(
        { userId, leadId, intent },
        "Lead activated; auto intent from time-to-activation (≤24h = high_intent)",
      );
    }
  }

  static async findDueForFollowupScan(): Promise<
    { id: string; status: LeadStatus; phone_number: string; followup_count: number }[]
  > {
    const r = await pool.query<{
      id: string;
      status: LeadStatus;
      phone_number: string;
      followup_count: number;
    }>(
      `SELECT id, status, phone_number, followup_count FROM leads
       WHERE status IN ('contacted', 'onboarded')
         AND next_followup_at IS NOT NULL
         AND next_followup_at <= now()
       ORDER BY next_followup_at ASC
       LIMIT 500`,
    );
    return r.rows;
  }

  /** Increments follow-up counter and pushes next_followup_at +24h (avoids tight rescan loops). */
  static async bumpFollowupFromScan(leadId: string): Promise<{ followup_count: number } | null> {
    const r = await pool.query<{ followup_count: number }>(
      `UPDATE leads
       SET followup_count = followup_count + 1,
           next_followup_at = now() + interval '24 hours',
           updated_at = now()
       WHERE id = $1
         AND status IN ('contacted', 'onboarded')
         AND next_followup_at IS NOT NULL
         AND next_followup_at <= now()
       RETURNING followup_count`,
      [leadId],
    );
    return r.rows[0] ?? null;
  }

  static async recordManualFollowup(leadId: string, businessId: string): Promise<LeadRow | null> {
    const r = await pool.query<LeadRow>(
      `UPDATE leads SET
         last_contacted_at = now(),
         next_followup_at = now() + interval '24 hours',
         updated_at = now()
       WHERE id = $1 AND business_id = $2
       RETURNING ${LEAD_COLUMNS}`,
      [leadId, businessId],
    );
    const row = r.rows[0] ?? null;
    if (row) {
      logger.info({ leadId }, "Lead follow-up contact recorded (manual)");
    }
    return row;
  }

  static async findAllForBusiness(businessId: string): Promise<LeadRow[]> {
    const r = await pool.query<LeadRow>(
      `SELECT ${LEAD_COLUMNS} FROM leads WHERE business_id = $1 ORDER BY created_at DESC`,
      [businessId],
    );
    return r.rows;
  }

  static async findById(id: string): Promise<LeadRow | null> {
    const r = await pool.query<LeadRow>(
      `SELECT ${LEAD_COLUMNS} FROM leads WHERE id = $1`,
      [id],
    );
    return r.rows[0] ?? null;
  }

  /** Resolves a lead for a tenant: 404 vs 403 vs row. */
  static async resolveLeadForTenant(leadId: string, businessId: string): Promise<LeadTenantAccess> {
    const r = await pool.query<LeadRow>(
      `SELECT ${LEAD_COLUMNS} FROM leads WHERE id = $1`,
      [leadId],
    );
    const row = r.rows[0];
    if (!row) {
      return { ok: false, reason: "not_found" };
    }
    if (row.business_id !== businessId) {
      return { ok: false, reason: "forbidden" };
    }
    return { ok: true, lead: row };
  }

  static async patchByIdForBusiness(
    id: string,
    businessId: string,
    patch: { status?: LeadStatus; notes?: string | null; intent_tag?: IntentTag | null },
  ): Promise<LeadRow | null> {
    const sets: string[] = ["updated_at = now()"];
    const vals: unknown[] = [];
    let i = 1;

    if (patch.status !== undefined) {
      sets.push(`status = $${i++}`);
      vals.push(patch.status);
    }
    if (patch.notes !== undefined) {
      sets.push(`notes = $${i++}`);
      vals.push(patch.notes);
    }
    if (patch.intent_tag !== undefined) {
      sets.push(`intent_tag = $${i++}`);
      vals.push(patch.intent_tag);
    }

    if (vals.length === 0) {
      const access = await LeadService.resolveLeadForTenant(id, businessId);
      return access.ok ? access.lead : null;
    }

    vals.push(id, businessId);
    const r = await pool.query<LeadRow>(
      `UPDATE leads SET ${sets.join(", ")} WHERE id = $${i} AND business_id = $${i + 1}
       RETURNING ${LEAD_COLUMNS}`,
      vals,
    );
    return r.rows[0] ?? null;
  }
}

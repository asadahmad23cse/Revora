import type { PoolClient, Pool } from "pg";
import { pool } from "../db/pool";
import { logger } from "../utils/logger";

export class UserService {
  static normalizePhone(phone: string): string {
    return phone.replace(/\s+/g, "").replace(/^\+/, "");
  }

  /** Resolve or create owner user by business phone */
  static async upsertByPhone(
    businessPhone: string,
    client?: PoolClient | Pool,
  ): Promise<{ id: string; config: unknown }> {
    const db = client ?? pool;
    const phone = UserService.normalizePhone(businessPhone);
    const r = await db.query<{ id: string; config: unknown }>(
      `INSERT INTO users (phone_number)
       VALUES ($1)
       ON CONFLICT (phone_number) DO UPDATE SET phone_number = EXCLUDED.phone_number
       RETURNING id, config`,
      [phone],
    );
    const row = r.rows[0];
    if (!row) {
      logger.error({ businessPhone: phone }, "upsertByPhone returned no row");
      throw new Error("Failed to upsert user");
    }
    logger.debug({ userId: row.id, phone }, "User resolved");
    return row;
  }

  static async getById(userId: string): Promise<{ id: string; phone_number: string } | null> {
    const r = await pool.query<{ id: string; phone_number: string }>(
      `SELECT id, phone_number FROM users WHERE id = $1`,
      [userId],
    );
    return r.rows[0] ?? null;
  }
}

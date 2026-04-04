import { pool } from "../db/pool";
import { UserService } from "./user.service";
import { logger } from "../utils/logger";
import { HttpError } from "../middlewares/httpError";

export class OnboardService {
  /**
   * Creates or updates the business row for this signup (owner phone).
   */
  static async createOrUpdateOwner(params: { name: string; phone: string }): Promise<{ userId: string }> {
    const phone = UserService.normalizePhone(params.phone);
    const name = params.name.trim();
    if (!phone || phone.length < 8) {
      throw new HttpError(400, "Invalid phone number", "invalid_phone");
    }
    const r = await pool.query<{ id: string }>(
      `INSERT INTO users (phone_number, display_name)
       VALUES ($1, $2)
       ON CONFLICT (phone_number) DO UPDATE SET
         display_name = COALESCE(EXCLUDED.display_name, users.display_name),
         phone_number = EXCLUDED.phone_number
       RETURNING id`,
      [phone, name],
    );
    const row = r.rows[0];
    if (!row) {
      throw new HttpError(500, "Onboard insert failed", "onboard_failed");
    }
    logger.info({ userId: row.id, phone }, "Owner onboarded from landing");
    return { userId: row.id };
  }
}

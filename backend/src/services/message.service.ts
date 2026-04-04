import type { Pool, PoolClient } from "pg";
import { pool } from "../db/pool";
import { logger } from "../utils/logger";
import type { MessageDirection } from "../types";

export type InsertMessageInput = {
  userId: string;
  /** Counterparty (customer) phone — same for incoming & outgoing */
  customerPhone: string;
  messageText: string | null;
  direction: MessageDirection;
  timestamp: Date;
  waMessageId: string | null;
};

type DbExecutor = Pool | PoolClient;

export class MessageService {
  static normalizePhone(phone: string): string {
    return phone.replace(/\s+/g, "").replace(/^\+/, "");
  }

  /**
   * Idempotent on wa_message_id when provided.
   * Returns { id, inserted }.
   */
  static async insertMessage(input: InsertMessageInput, client?: DbExecutor): Promise<{ id: string; inserted: boolean }> {
    const db = client ?? pool;
    const phone = MessageService.normalizePhone(input.customerPhone);

    if (input.waMessageId) {
      const existing = await db.query<{ id: string }>(
        `SELECT id FROM messages WHERE wa_message_id = $1`,
        [input.waMessageId],
      );
      if (existing.rows[0]) {
        logger.info({ waMessageId: input.waMessageId }, "Duplicate WhatsApp message ignored");
        return { id: existing.rows[0].id, inserted: false };
      }
    }

    const r = await db.query<{ id: string }>(
      `INSERT INTO messages (user_id, phone_number, message_text, direction, "timestamp", wa_message_id)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id`,
      [input.userId, phone, input.messageText, input.direction, input.timestamp.toISOString(), input.waMessageId],
    );
    const row = r.rows[0];
    if (!row) throw new Error("Insert message failed");
    logger.info(
      {
        messageId: row.id,
        userId: input.userId,
        direction: input.direction,
        customerPhone: phone,
      },
      "Message stored",
    );
    return { id: row.id, inserted: true };
  }

  static async getById(messageId: string, client?: DbExecutor): Promise<{
    id: string;
    user_id: string;
    phone_number: string;
    message_text: string | null;
    direction: MessageDirection;
    timestamp: Date;
  } | null> {
    const db = client ?? pool;
    const r = await db.query<{
      id: string;
      user_id: string;
      phone_number: string;
      message_text: string | null;
      direction: MessageDirection;
      timestamp: Date;
    }>(
      `SELECT id, user_id, phone_number, message_text, direction, "timestamp" FROM messages WHERE id = $1`,
      [messageId],
    );
    const row = r.rows[0];
    if (!row) return null;
    return row;
  }

  /** Any owner reply strictly after this incoming message */
  static async hasOutgoingAfter(params: {
    userId: string;
    customerPhone: string;
    after: Date;
  }): Promise<boolean> {
    const phone = MessageService.normalizePhone(params.customerPhone);
    const r = await pool.query<{ c: string }>(
      `SELECT COUNT(*)::text AS c
       FROM messages
       WHERE user_id = $1
         AND phone_number = $2
         AND direction = 'outgoing'
         AND "timestamp" > $3`,
      [params.userId, phone, params.after.toISOString()],
    );
    const n = Number(r.rows[0]?.c ?? "0");
    return n > 0;
  }
}

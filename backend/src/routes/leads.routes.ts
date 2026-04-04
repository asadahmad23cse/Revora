import { Router, type Request, type Response, type NextFunction } from "express";
import { z } from "zod";
import { pool } from "../db/pool";
import { logger } from "../utils/logger";
import type { LeadRow } from "../services/lead.service";

const leadsRouter = Router();

type LeadListRow = Pick<
  LeadRow,
  "id" | "name" | "phone_number" | "source" | "status" | "followup_count" | "next_followup_at" | "created_at"
>;

type LeadMessageRow = {
  id: string;
  content: string;
  status: string;
  source: string;
  created_at: Date;
};

const uuidParam = z.object({
  id: z.string().uuid(),
});

const LIST_SQL = `SELECT id, name, phone_number, source, status, followup_count, next_followup_at, created_at
  FROM leads ORDER BY created_at DESC`;

/** Returns all leads for the admin dashboard (newest first). */
leadsRouter.get("/leads", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const r = await pool.query<LeadListRow>(LIST_SQL);
    res.status(200).json({ leads: r.rows });
  } catch (e) {
    logger.error({ err: e }, "GET /api/leads failed");
    next(e);
  }
});

/** Returns simulated / manual messages for a lead, oldest first. */
leadsRouter.get("/leads/:id/messages", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = uuidParam.parse(req.params);
    const exists = await pool.query<{ one: number }>(`SELECT 1 AS one FROM leads WHERE id = $1 LIMIT 1`, [id]);
    if (exists.rows.length === 0) {
      res.status(404).json({ error: "Lead not found", code: "lead_not_found" });
      return;
    }
    const r = await pool.query<LeadMessageRow>(
      `SELECT id, content, status, source, created_at
       FROM lead_messages
       WHERE lead_id = $1
       ORDER BY created_at ASC`,
      [id],
    );
    res.status(200).json({ messages: r.rows });
  } catch (e) {
    logger.error({ err: e }, "GET /api/leads/:id/messages failed");
    next(e);
  }
});

/** Returns one lead by id. */
leadsRouter.get("/leads/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = uuidParam.parse(req.params);
    const r = await pool.query<LeadRow>(
      `SELECT id, name, phone_number, source, status, intent_tag, notes, user_id,
              last_contacted_at, next_followup_at, followup_count, created_at, updated_at
       FROM leads WHERE id = $1`,
      [id],
    );
    const row = r.rows[0];
    if (!row) {
      res.status(404).json({ error: "Lead not found", code: "lead_not_found" });
      return;
    }
    res.status(200).json({ lead: row });
  } catch (e) {
    next(e);
  }
});

export { leadsRouter };

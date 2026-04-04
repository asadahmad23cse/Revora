import { Router, type Request, type Response, type NextFunction } from "express";
import { z } from "zod";
import { pool } from "../db/pool";
import { logger } from "../utils/logger";
import { requireAuth } from "../middlewares/requireAuth";
import { LeadService, type LeadRow } from "../services/lead.service";

const leadsRouter = Router();

leadsRouter.use(requireAuth);

type LeadListRow = Pick<
  LeadRow,
  | "id"
  | "name"
  | "phone_number"
  | "source"
  | "status"
  | "followup_count"
  | "next_followup_at"
  | "created_at"
  | "business_id"
  | "email"
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

/** GET /api/leads — tenant-scoped (JWT). */
leadsRouter.get("/leads", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const businessId = req.businessId;
    if (!businessId) {
      res.status(401).json({ error: "Unauthorized", code: "unauthorized" });
      return;
    }
    const r = await pool.query<LeadListRow>(
      `SELECT id, name, phone_number, source, status, followup_count, next_followup_at, created_at, business_id, email
       FROM leads
       WHERE business_id = $1
       ORDER BY created_at DESC`,
      [businessId],
    );
    res.status(200).json({ leads: r.rows });
  } catch (e) {
    logger.error({ err: e }, "GET /api/leads failed");
    next(e);
  }
});

/** GET /api/leads/:id/messages */
leadsRouter.get("/leads/:id/messages", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const businessId = req.businessId;
    if (!businessId) {
      res.status(401).json({ error: "Unauthorized", code: "unauthorized" });
      return;
    }
    const { id } = uuidParam.parse(req.params);
    const access = await LeadService.resolveLeadForTenant(id, businessId);
    if (!access.ok) {
      if (access.reason === "not_found") {
        res.status(404).json({ error: "Lead not found", code: "lead_not_found" });
        return;
      }
      res.status(403).json({ error: "Lead does not belong to this business", code: "forbidden" });
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

/** GET /api/leads/:id */
leadsRouter.get("/leads/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const businessId = req.businessId;
    if (!businessId) {
      res.status(401).json({ error: "Unauthorized", code: "unauthorized" });
      return;
    }
    const { id } = uuidParam.parse(req.params);
    const access = await LeadService.resolveLeadForTenant(id, businessId);
    if (!access.ok) {
      if (access.reason === "not_found") {
        res.status(404).json({ error: "Lead not found", code: "lead_not_found" });
        return;
      }
      res.status(403).json({ error: "Lead does not belong to this business", code: "forbidden" });
      return;
    }
    res.status(200).json({ lead: access.lead });
  } catch (e) {
    next(e);
  }
});

export { leadsRouter };

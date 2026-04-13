import { Router, type Request, type Response, type NextFunction } from "express";
import { randomUUID } from "crypto";
import { z } from "zod";
import { config } from "../config";
import { WebhookService } from "../services/webhook.service";
import { UserService } from "../services/user.service";
import { ReportQueue } from "../queues/report.queue";
import { tryDeliverPlainTextWhatsApp } from "../services/whatsapp";
import { tryDeliverPlainTextTelegram } from "../services/telegram";
import { getQueueMetricsSnapshot } from "../queues/metrics";
import { pool } from "../db/pool";

const devRouter = Router();

/** Blocks `/dev/*` unless `NODE_ENV` is `development`. */
devRouter.use((_req: Request, res: Response, next: NextFunction) => {
  if (config.nodeEnv !== "development") {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  next();
});

const simulateBody = z.object({
  phone: z.string().min(3),
  text: z.string(),
  businessId: z.string().uuid(),
});

/** Builds a synthetic Meta payload and runs the normal webhook ingest + ingest queue path. */
devRouter.post("/simulate-message", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = simulateBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid body", details: parsed.error.flatten() });
      return;
    }
    const { phone, text, businessId } = parsed.data;
    const bizRow = await pool.query<{ phone_number: string | null }>(
      `SELECT phone_number FROM businesses WHERE id = $1 LIMIT 1`,
      [businessId],
    );
    if (bizRow.rows.length === 0) {
      res.status(404).json({ error: "business not found", code: "business_not_found" });
      return;
    }
    const rawBizPhone = bizRow.rows[0]?.phone_number?.trim();
    if (!rawBizPhone) {
      res.status(400).json({
        error: "Business has no phone_number; set it at registration or update businesses.",
        code: "business_phone_missing",
      });
      return;
    }
    const normalizedBizPhone = UserService.normalizePhone(rawBizPhone);
    const upserted = await UserService.upsertByPhone(normalizedBizPhone);
    const user = await UserService.getById(upserted.id);
    if (!user) {
      res.status(404).json({ error: "WhatsApp user not found for business phone", code: "user_not_found" });
      return;
    }
    const messageId = `sim_${randomUUID()}`;
    const businessPhone = user.phone_number;
    const payload = {
      object: "whatsapp_business_account",
      entry: [
        {
          id: "dev_waba",
          changes: [
            {
              field: "messages",
              value: {
                messaging_product: "whatsapp",
                metadata: {
                  display_phone_number: businessPhone,
                  phone_number_id: config.whatsappPhoneNumberId,
                },
                contacts: [
                  {
                    profile: { name: "Dev Simulate" },
                    wa_id: UserService.normalizePhone(phone),
                  },
                ],
                messages: [
                  {
                    from: UserService.normalizePhone(phone),
                    id: messageId,
                    timestamp: String(Math.floor(Date.now() / 1000)),
                    type: "text",
                    text: { body: text },
                  },
                ],
              },
            },
          ],
        },
      ],
    };
    await WebhookService.ingestRawPayload({
      body: payload,
      businessPhoneHeader: undefined,
      headerFallback: {},
      businessId,
    });
    res.status(200).json({ queued: true, messageId });
  } catch (e) {
    next(e);
  }
});

const triggerBody = z.object({ businessId: z.string().uuid() });

/** Enqueues a 14-day report job for the given owner user id. */
devRouter.post("/trigger-report", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = triggerBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid body" });
      return;
    }
    await ReportQueue.enqueueReport({
      userId: parsed.data.businessId,
      window: "14days",
      trigger: "manual_api",
    });
    res.status(200).json({ triggered: true });
  } catch (e) {
    next(e);
  }
});

const sendBody = z.object({
  to: z.string().min(3),
  message: z.string().min(1),
});

const sendTelegramBody = z.object({
  chatId: z.string().min(1),
  message: z.string().min(1),
});

/** Sends a real Cloud API text message (development helper). */
devRouter.post("/send-whatsapp", async (req: Request, res: Response) => {
  const parsed = sendBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid body" });
    return;
  }
  const ok = await tryDeliverPlainTextWhatsApp(parsed.data.to, parsed.data.message);
  if (ok) {
    res.status(200).json({ sent: true });
    return;
  }
  res.status(200).json({ error: "Meta API failed after retries" });
});

/** Sends a real Telegram text message (development helper). */
devRouter.post("/send-telegram", async (req: Request, res: Response) => {
  const parsed = sendTelegramBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid body" });
    return;
  }
  const ok = await tryDeliverPlainTextTelegram(parsed.data.chatId, parsed.data.message);
  if (ok) {
    res.status(200).json({ sent: true });
    return;
  }
  res.status(200).json({ error: "Telegram API failed after retries" });
});

/** Aggregated BullMQ job counts across Revora queues. */
devRouter.get("/queue-status", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const snap = await getQueueMetricsSnapshot();
    const sum = (key: "waiting" | "active" | "failed" | "completed"): number =>
      snap.ingest[key] +
      snap.risk[key] +
      snap.leak[key] +
      snap.report[key] +
      snap.deadLetter[key] +
      snap.leadFollowup[key];
    res.status(200).json({
      waiting: sum("waiting"),
      active: sum("active"),
      failed: sum("failed"),
      completed: sum("completed"),
    });
  } catch (e) {
    next(e);
  }
});

type DemoLeadSeed = {
  name: string;
  phone: string;
  source: "whatsapp" | "instagram" | "manual";
  status: string;
  followup_count: number;
  next_followup_at: Date | null;
};

/** Removes prior Demo:* leads and inserts 10 fixed demo rows (upsert by phone). */
devRouter.post("/seed-demo", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    await pool.query(`DELETE FROM leads WHERE name LIKE 'Demo:%'`);
    const now = Date.now();
    const offset = (ms: number) => new Date(now + ms);
    const demoLeads: DemoLeadSeed[] = [
      {
        name: "Demo: Kavita Sharma",
        phone: "919811001001",
        source: "whatsapp",
        status: "new",
        followup_count: 0,
        next_followup_at: offset(60 * 60 * 1000),
      },
      {
        name: "Demo: Rahul Mehta",
        phone: "919811001002",
        source: "instagram",
        status: "contacted",
        followup_count: 1,
        next_followup_at: offset(-30 * 60 * 1000),
      },
      {
        name: "Demo: Priya Catering",
        phone: "919811001003",
        source: "whatsapp",
        status: "contacted",
        followup_count: 2,
        next_followup_at: offset(-2 * 60 * 60 * 1000),
      },
      {
        name: "Demo: Arjun Tiffins",
        phone: "919811001004",
        source: "manual",
        status: "onboarded",
        followup_count: 1,
        next_followup_at: offset(-1 * 60 * 60 * 1000),
      },
      {
        name: "Demo: Sunita Kitchen",
        phone: "919811001005",
        source: "instagram",
        status: "onboarded",
        followup_count: 3,
        next_followup_at: offset(3 * 60 * 60 * 1000),
      },
      {
        name: "Demo: Mohan Foods",
        phone: "919811001006",
        source: "whatsapp",
        status: "interested",
        followup_count: 2,
        next_followup_at: offset(6 * 60 * 60 * 1000),
      },
      {
        name: "Demo: Anita Home Chef",
        phone: "919811001007",
        source: "instagram",
        status: "trial",
        followup_count: 4,
        next_followup_at: offset(12 * 60 * 60 * 1000),
      },
      {
        name: "Demo: Vikram Cloud Kit",
        phone: "919811001008",
        source: "manual",
        status: "active",
        followup_count: 5,
        next_followup_at: offset(24 * 60 * 60 * 1000),
      },
      {
        name: "Demo: Fatima Biryani",
        phone: "919811001009",
        source: "whatsapp",
        status: "dropped",
        followup_count: 2,
        next_followup_at: null,
      },
      {
        name: "Demo: Ravi Sweets",
        phone: "919811001010",
        source: "instagram",
        status: "trial",
        followup_count: 3,
        next_followup_at: offset(-3 * 60 * 60 * 1000),
      },
    ];

    for (const d of demoLeads) {
      await pool.query(
        `INSERT INTO leads (name, phone_number, source, status, followup_count, next_followup_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, now())
         ON CONFLICT (phone_number) DO UPDATE SET
           name = EXCLUDED.name,
           source = EXCLUDED.source,
           status = EXCLUDED.status,
           followup_count = EXCLUDED.followup_count,
           next_followup_at = EXCLUDED.next_followup_at,
           updated_at = now()`,
        [d.name, d.phone, d.source, d.status, d.followup_count, d.next_followup_at],
      );
    }

    res.status(200).json({ success: true, created: 10 });
  } catch (e) {
    next(e);
  }
});

/** Simulates the follow-up worker for due leads (contacted, onboarded, trial) with staged messages. */
devRouter.post("/run-worker", async (_req: Request, res: Response, next: NextFunction) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const upd = await client.query<{ id: string; name: string; followup_count: number }>(
      `UPDATE leads SET
         followup_count = followup_count + 1,
         next_followup_at = now() + interval '24 hours',
         last_contacted_at = now(),
         updated_at = now()
       WHERE next_followup_at IS NOT NULL
         AND next_followup_at <= now()
         AND status IN ('contacted', 'onboarded', 'trial')
       RETURNING id, name, followup_count`,
    );

    const leadsOut: { id: string; name: string; followup_count: number }[] = [];
    for (const row of upd.rows) {
      const content = `Auto follow-up #${row.followup_count} sent to ${row.name}`;
      await client.query(
        `INSERT INTO lead_messages (lead_id, content, status, source)
         VALUES ($1, $2, 'sent (simulated)', 'worker_auto')`,
        [row.id, content],
      );
      leadsOut.push({ id: row.id, name: row.name, followup_count: row.followup_count });
    }
    await client.query("COMMIT");
    res.status(200).json({ processed: leadsOut.length, leads: leadsOut });
  } catch (e) {
    try {
      await client.query("ROLLBACK");
    } catch {
      /* ignore */
    }
    next(e);
  } finally {
    client.release();
  }
});

const leadSendBody = z.object({
  lead_id: z.string().uuid(),
  content: z.string().min(1),
});

/** Appends a manual simulated message to `lead_messages` for a lead. */
devRouter.post("/send-message", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = leadSendBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid body", details: parsed.error.flatten() });
      return;
    }
    const { lead_id, content } = parsed.data;
    const ex = await pool.query<{ id: string }>(`SELECT id FROM leads WHERE id = $1`, [lead_id]);
    if (ex.rows.length === 0) {
      res.status(404).json({ error: "Lead not found", code: "lead_not_found" });
      return;
    }
    await pool.query(
      `INSERT INTO lead_messages (lead_id, content, status, source)
       VALUES ($1, $2, 'sent (simulated)', 'manual')`,
      [lead_id, content],
    );
    res.status(200).json({
      success: true,
      status: "sent (simulated)",
      timestamp: new Date().toISOString(),
    });
  } catch (e) {
    next(e);
  }
});

export { devRouter };

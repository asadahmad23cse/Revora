import { Router, type Request, type Response, type NextFunction } from "express";
import { randomUUID } from "crypto";
import { z } from "zod";
import { config } from "../config";
import { WebhookService } from "../services/webhook.service";
import { UserService } from "../services/user.service";
import { ReportQueue } from "../queues/report.queue";
import { tryDeliverPlainTextWhatsApp } from "../services/whatsapp";
import { getQueueMetricsSnapshot } from "../queues/metrics";

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
    const user = await UserService.getById(businessId);
    if (!user) {
      res.status(404).json({ error: "businessId not found" });
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

export { devRouter };

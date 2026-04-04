import { Router, raw } from "express";
import { verifyWebhookSignature } from "../middlewares/webhookSignature";
import { captureRawJsonAndParse } from "../middlewares/webhookRawBody";
import { webhookRateLimiter } from "../middlewares/webhookRateLimit";
import { postWebhook, postWebhookWhatsApp } from "../controllers/webhook.controller";

const webhookRouter = Router();

const webhookStack = [
  raw({ type: "application/json", limit: "512kb" }),
  verifyWebhookSignature,
  captureRawJsonAndParse,
  webhookRateLimiter,
] as const;

webhookRouter.post("/webhook", ...webhookStack, postWebhook);

/** 360dialog: fast 200 + async ingest (same verification + Cloud API JSON as /webhook). */
webhookRouter.post("/webhook/whatsapp", ...webhookStack, postWebhookWhatsApp);

export { webhookRouter };

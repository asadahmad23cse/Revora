import { Router, raw, json } from "express";
import { verifyWebhookSignature } from "../middlewares/webhookSignature";
import { captureRawJsonAndParse } from "../middlewares/webhookRawBody";
import { webhookRateLimiter } from "../middlewares/webhookRateLimit";
import {
  getMetaWhatsAppWebhookVerify,
  postMetaWhatsAppWebhook,
  postTelegramWebhook,
  postWebhook,
} from "../controllers/webhook.controller";

const webhookRouter = Router();

const webhookStack = [
  raw({ type: "application/json", limit: "512kb" }),
  verifyWebhookSignature,
  captureRawJsonAndParse,
  webhookRateLimiter,
] as const;

webhookRouter.get("/webhook/whatsapp", getMetaWhatsAppWebhookVerify);

webhookRouter.post(
  "/webhook/whatsapp",
  ...webhookStack,
  postMetaWhatsAppWebhook,
);

webhookRouter.post(
  "/webhook/telegram",
  json({ limit: "512kb" }),
  webhookRateLimiter,
  postTelegramWebhook,
);

webhookRouter.post("/webhook", ...webhookStack, postWebhook);

export { webhookRouter };

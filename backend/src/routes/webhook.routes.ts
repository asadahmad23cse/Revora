import express, { Router, raw } from "express";
import { verifyWebhookSignature } from "../middlewares/webhookSignature";
import { captureRawJsonAndParse } from "../middlewares/webhookRawBody";
import { webhookRateLimiter } from "../middlewares/webhookRateLimit";
import {
  getMetaWhatsAppWebhookVerify,
  postMetaWhatsAppWebhook,
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
  express.json({ limit: "512kb" }),
  webhookRateLimiter,
  postMetaWhatsAppWebhook,
);

webhookRouter.post("/webhook", ...webhookStack, postWebhook);

export { webhookRouter };

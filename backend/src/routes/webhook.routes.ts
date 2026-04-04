import { Router, raw } from "express";
import { verifyWebhookSignature } from "../middlewares/webhookSignature";
import { captureRawJsonAndParse } from "../middlewares/webhookRawBody";
import { webhookRateLimiter } from "../middlewares/webhookRateLimit";
import { postWebhook } from "../controllers/webhook.controller";

const webhookRouter = Router();

webhookRouter.post(
  "/webhook",
  raw({ type: "application/json", limit: "512kb" }),
  verifyWebhookSignature,
  captureRawJsonAndParse,
  webhookRateLimiter,
  postWebhook,
);

export { webhookRouter };

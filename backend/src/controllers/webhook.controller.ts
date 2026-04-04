import type { Request, Response, NextFunction } from "express";
import { WebhookService } from "../services/webhook.service";
import { logger } from "../utils/logger";

function parseNumberHeader(value: string | undefined): number | undefined {
  if (value === undefined || value === "") return undefined;
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return undefined;
  return n;
}

export async function postWebhook(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const headerAov = parseNumberHeader(req.header("x-aov-inr"));
    const headerThreshold = parseNumberHeader(req.header("x-response-threshold-seconds"));
    const businessPhoneHeader = req.header("x-business-phone") ?? undefined;

    const result = await WebhookService.ingestRawPayload({
      body: req.body,
      businessPhoneHeader,
      headerFallback: {
        aovInr: headerAov,
        thresholdSeconds: headerThreshold,
      },
    });

    logger.info(
      {
        requestId: req.id,
        ...result,
      },
      "Webhook batch processed",
    );

    res.status(200).json({ ok: true, ...result });
  } catch (e) {
    next(e);
  }
}

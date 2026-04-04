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

/**
 * 360dialog / Cloud API production path: acknowledge immediately, ingest + enqueue in background.
 * Same HMAC middleware and payload shape as POST /webhook; does not block on DB/BullMQ.
 */
export function postWebhookWhatsApp(req: Request, res: Response, next: NextFunction): void {
  try {
    const headerAov = parseNumberHeader(req.header("x-aov-inr"));
    const headerThreshold = parseNumberHeader(req.header("x-response-threshold-seconds"));
    const businessPhoneHeader = req.header("x-business-phone") ?? undefined;

    void WebhookService.ingestRawPayload({
      body: req.body,
      businessPhoneHeader,
      headerFallback: {
        aovInr: headerAov,
        thresholdSeconds: headerThreshold,
      },
    })
      .then((result) => {
        logger.info({ requestId: req.id, ...result }, "WhatsApp webhook ingest completed (async)");
      })
      .catch((err) => {
        logger.error({ requestId: req.id, err }, "WhatsApp webhook ingest failed (async)");
      });

    res.status(200).json({ ok: true, received: true });
  } catch (e) {
    next(e);
  }
}

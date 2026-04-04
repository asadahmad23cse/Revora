import type { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { isTestSimulateApiEnabled } from "../config";
import { HttpError } from "../middlewares/httpError";
import { UserService } from "../services/user.service";
import { WebhookService } from "../services/webhook.service";

const bodySchema = z.object({
  user_id: z.string().uuid(),
  customer_phone: z.string().min(5),
  text: z.string().optional(),
  wa_message_id: z.string().optional(),
});

/**
 * Test helper: simulates an inbound WhatsApp Cloud message for a known tenant (user id).
 * Requires TEST_MODE=true or ALLOW_TEST_SIMULATE_API=true.
 */
export async function postTestSimulateInbound(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!isTestSimulateApiEnabled()) {
      res.status(404).json({ error: "Not found", code: "not_found" });
      return;
    }
    const parsed = bodySchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: "Invalid request",
        code: "validation_error",
        details: parsed.error.flatten(),
      });
      return;
    }
    const user = await UserService.getById(parsed.data.user_id);
    if (!user) {
      throw new HttpError(404, "User not found", "user_not_found");
    }
    const waMessageId =
      parsed.data.wa_message_id ??
      `test-sim-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;

    const body = {
      simulate: true as const,
      business_phone: user.phone_number,
      customer_phone: parsed.data.customer_phone,
      direction: "incoming" as const,
      text: parsed.data.text ?? "Test inbound: 2 paneer rolls please",
      wa_message_id: waMessageId,
    };

    const result = await WebhookService.ingestRawPayload({
      body,
      headerFallback: {},
    });

    res.status(200).json({
      ok: true,
      user_id: user.id,
      business_phone: user.phone_number,
      ...result,
    });
  } catch (e) {
    next(e);
  }
}

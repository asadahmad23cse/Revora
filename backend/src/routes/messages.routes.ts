import { Router, type NextFunction, type Request, type Response } from "express";
import { z } from "zod";
import { config } from "../config";
import { HttpError } from "../middlewares/httpError";
import { requireAuth } from "../middlewares/requireAuth";
import { ReportService } from "../services/report.service";
import { tryDeliverPlainTextTelegram } from "../services/telegram";
import { tryDeliverPlainTextWhatsApp } from "../services/whatsapp";

const messagesRouter = Router();
messagesRouter.use(requireAuth);

const sendMessageSchema = z.object({
  to: z.string().trim().min(3).max(64),
  message: z.string().trim().min(1).max(4096),
});

/** Sends a tenant-owned outbound message through the configured production provider. */
messagesRouter.post("/messages", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const businessId = req.businessId;
    if (!businessId) {
      throw new HttpError(401, "Unauthorized", "unauthorized");
    }
    const parsed = sendMessageSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: "Invalid request",
        code: "validation_error",
        details: parsed.error.flatten(),
      });
      return;
    }

    const ownerUserId = await ReportService.resolveWhatsAppUserIdForBusiness(businessId);
    if (!ownerUserId) {
      throw new HttpError(
        409,
        "Your business phone is not connected yet. Complete onboarding with the registered business phone first.",
        "business_phone_not_linked",
      );
    }

    const sent =
      config.messagingProvider === "telegram"
        ? await tryDeliverPlainTextTelegram(parsed.data.to, parsed.data.message, ownerUserId)
        : await tryDeliverPlainTextWhatsApp(parsed.data.to, parsed.data.message, ownerUserId);
    if (!sent) {
      throw new HttpError(502, "The messaging provider could not deliver this message. Please try again.", "delivery_failed");
    }
    res.status(200).json({ ok: true, sent: true, provider: config.messagingProvider });
  } catch (error) {
    next(error);
  }
});

export { messagesRouter };

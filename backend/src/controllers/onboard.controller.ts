import type { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { OnboardService } from "../services/onboard.service";
import { LeadService } from "../services/lead.service";
import { logger } from "../utils/logger";

const bodySchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(200),
  phone: z.string().trim().min(8, "Phone is required").max(24),
  source: z.enum(["instagram", "whatsapp", "manual"]).optional(),
});

export async function postOnboard(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const parsed = bodySchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: "Invalid request",
        code: "validation_error",
        details: parsed.error.flatten(),
      });
      return;
    }
    const source = LeadService.normalizeSource(parsed.data.source);
    const { userId } = await OnboardService.createOrUpdateOwner({ ...parsed.data, source });
    res.status(200).json({ ok: true, userId, user_id: userId });
  } catch (e) {
    logger.warn({ err: e }, "Onboard failed");
    next(e);
  }
}

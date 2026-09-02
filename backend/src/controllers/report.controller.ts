import type { Request, Response, NextFunction } from "express";
import { ReportService } from "../services/report.service";
import { ReportQueue } from "../queues/report.queue";

async function resolveTenantUserId(req: Request, res: Response): Promise<string | null> {
  const businessId = req.businessId;
  if (!businessId) {
    res.status(401).json({ error: "Unauthorized", code: "unauthorized" });
    return null;
  }
  const userId = await ReportService.resolveWhatsAppUserIdForBusiness(businessId);
  if (!userId) {
    res.status(404).json({
      error: "No WhatsApp account linked to this business. Onboard with the same phone as your business or link your tenant.",
      code: "whatsapp_user_not_linked",
    });
    return null;
  }
  return userId;
}

export async function getDailyReport(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = await resolveTenantUserId(req, res);
    if (!userId) return;
    void ReportQueue.enqueueReport({ userId, window: "daily", trigger: "manual_api" });
    const report = await ReportService.generate({ userId, window: "daily" });
    res.json(report);
  } catch (e) {
    next(e);
  }
}

/** Requires `requireAuth` upstream: resolves WhatsApp `users.id` from JWT `businessId`. */
export async function get14DayReport(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = await resolveTenantUserId(req, res);
    if (!userId) return;
    void ReportQueue.enqueueReport({ userId, window: "14days", trigger: "manual_api" });
    const report = await ReportService.generate({ userId, window: "14days" });
    res.json(report);
  } catch (e) {
    next(e);
  }
}

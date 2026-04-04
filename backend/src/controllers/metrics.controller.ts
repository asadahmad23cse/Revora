import type { Request, Response, NextFunction } from "express";
import { MetricsService } from "../services/metrics.service";

export async function getMetrics(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const businessId = req.businessId;
    if (!businessId) {
      res.status(401).json({ error: "Unauthorized", code: "unauthorized" });
      return;
    }
    const metrics = await MetricsService.getAcquisitionForBusiness(businessId);
    res.json({ ok: true, metrics });
  } catch (e) {
    next(e);
  }
}

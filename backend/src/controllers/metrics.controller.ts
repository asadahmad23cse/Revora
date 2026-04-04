import type { Request, Response, NextFunction } from "express";
import { MetricsService } from "../services/metrics.service";

export async function getMetrics(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const metrics = await MetricsService.getAcquisition();
    res.json({ ok: true, metrics });
  } catch (e) {
    next(e);
  }
}

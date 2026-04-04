import type { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { ReportService } from "../services/report.service";
import { ReportQueue } from "../queues/report.queue";

const querySchema = z.object({
  userId: z.string().uuid(),
});

export async function getDailyReport(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { userId } = querySchema.parse(req.query);
    void ReportQueue.enqueueReport({ userId, window: "daily" });
    const report = await ReportService.generate({ userId, window: "daily" });
    res.json(report);
  } catch (e) {
    next(e);
  }
}

export async function get14DayReport(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { userId } = querySchema.parse(req.query);
    void ReportQueue.enqueueReport({ userId, window: "14days" });
    const report = await ReportService.generate({ userId, window: "14days" });
    res.json(report);
  } catch (e) {
    next(e);
  }
}

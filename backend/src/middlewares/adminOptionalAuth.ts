import type { Request, Response, NextFunction } from "express";
import { config } from "../config";

/** If ADMIN_API_KEY is set, require matching X-Admin-Key header. Otherwise allow (local dev). */
export function optionalAdminAuth(req: Request, res: Response, next: NextFunction): void {
  const required = config.adminApiKey;
  if (!required) {
    next();
    return;
  }
  const sent = req.get("x-admin-key");
  if (sent === required) {
    next();
    return;
  }
  res.status(401).json({ error: "Unauthorized", code: "admin_auth_required" });
}

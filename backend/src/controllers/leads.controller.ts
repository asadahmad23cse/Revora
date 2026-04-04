import type { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { LeadService, type LeadStatus, type IntentTag } from "../services/lead.service";
import { HttpError } from "../middlewares/httpError";
import { logger } from "../utils/logger";

const uuidParam = z.object({
  id: z.string().uuid(),
});

const leadStatusEnum = z.enum([
  "new",
  "contacted",
  "onboarded",
  "interested",
  "trial",
  "active",
  "dropped",
]);

const patchBody = z.object({
  status: leadStatusEnum.optional(),
  notes: z.string().nullable().optional(),
  intent_tag: z.enum(["high_intent", "low_intent"]).nullable().optional(),
});

export async function patchLead(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const businessId = req.businessId;
    if (!businessId) {
      res.status(401).json({ error: "Unauthorized", code: "unauthorized" });
      return;
    }
    const { id } = uuidParam.parse(req.params);
    const parsed = patchBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: "Invalid request",
        code: "validation_error",
        details: parsed.error.flatten(),
      });
      return;
    }
    const access = await LeadService.resolveLeadForTenant(id, businessId);
    if (!access.ok) {
      if (access.reason === "not_found") {
        throw new HttpError(404, "Lead not found", "lead_not_found");
      }
      throw new HttpError(403, "Lead does not belong to this business", "forbidden");
    }
    const existing = access.lead;
    const patch: { status?: LeadStatus; notes?: string | null; intent_tag?: IntentTag | null } = {};
    if (parsed.data.status !== undefined) patch.status = parsed.data.status;
    if (parsed.data.notes !== undefined) patch.notes = parsed.data.notes;
    if (parsed.data.intent_tag !== undefined) patch.intent_tag = parsed.data.intent_tag;

    const updated = await LeadService.patchByIdForBusiness(id, businessId, patch);
    if (!updated) {
      throw new HttpError(404, "Lead not found", "lead_not_found");
    }

    if (parsed.data.status !== undefined && parsed.data.status !== existing.status) {
      logger.info(
        { leadId: id, from: existing.status, to: parsed.data.status },
        "Lead conversion status changed",
      );
      if (parsed.data.status === "dropped") {
        logger.info({ leadId: id }, "Lead drop event recorded");
      }
    }

    res.json({ ok: true, lead: updated });
  } catch (e) {
    next(e);
  }
}

export async function postLeadFollowup(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const businessId = req.businessId;
    if (!businessId) {
      res.status(401).json({ error: "Unauthorized", code: "unauthorized" });
      return;
    }
    const { id } = uuidParam.parse(req.params);
    const access = await LeadService.resolveLeadForTenant(id, businessId);
    if (!access.ok) {
      if (access.reason === "not_found") {
        throw new HttpError(404, "Lead not found", "lead_not_found");
      }
      throw new HttpError(403, "Lead does not belong to this business", "forbidden");
    }
    const updated = await LeadService.recordManualFollowup(id, businessId);
    if (!updated) {
      throw new HttpError(404, "Lead not found", "lead_not_found");
    }
    res.json({ ok: true, lead: updated });
  } catch (e) {
    next(e);
  }
}

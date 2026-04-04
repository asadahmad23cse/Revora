import { redisConnection } from "../queues/connection";
import { config } from "../config";
import { logger } from "../utils/logger";

/**
 * Best-effort deduplication for webhook retries (in addition to DB unique on wa_message_id).
 */
export class IdempotencyService {
  static cacheKey(waMessageId: string): string {
    return `revora:idempotency:wa:${waMessageId}`;
  }

  /** @returns true if this id is newly claimed, false if duplicate webhook */
  static async tryClaimWaDelivery(waMessageId: string | null): Promise<boolean> {
    if (!waMessageId || !waMessageId.trim()) {
      return true;
    }
    const key = IdempotencyService.cacheKey(waMessageId.trim());
    const ok = await redisConnection.set(key, "1", "EX", config.idempotencyWaTtlSeconds, "NX");
    if (ok !== "OK") {
      logger.info({ waMessageId: waMessageId.trim() }, "Duplicate WhatsApp delivery suppressed (Redis idempotency)");
      return false;
    }
    return true;
  }

  static async releaseClaim(waMessageId: string | null): Promise<void> {
    if (!waMessageId || !waMessageId.trim()) return;
    try {
      await redisConnection.del(IdempotencyService.cacheKey(waMessageId.trim()));
    } catch (e) {
      logger.warn({ err: e, waMessageId }, "Failed to release idempotency key");
    }
  }
}

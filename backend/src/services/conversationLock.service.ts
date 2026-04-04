import crypto from "crypto";
import { redisConnection } from "../queues/connection";
import { config } from "../config";
import { logger } from "../utils/logger";

const RELEASE_LUA = `
if redis.call("get", KEYS[1]) == ARGV[1] then
  return redis.call("del", KEYS[1])
end
return 0
`;

export type ConversationLockHandle = {
  key: string;
  token: string;
};

/**
 * Redis lock per (business user × customer phone) to serialize conversation side-effects across workers.
 */
export class ConversationLockService {
  static keyFor(userId: string, customerPhone: string): string {
    return `revora:lock:conv:${userId}:${customerPhone}`;
  }

  static async acquire(userId: string, customerPhone: string): Promise<ConversationLockHandle | null> {
    const key = ConversationLockService.keyFor(userId, customerPhone);
    const token = crypto.randomBytes(16).toString("hex");
    const ok = await redisConnection.set(key, token, "EX", config.conversationLockTtlSeconds, "NX");
    if (ok !== "OK") {
      logger.debug({ key }, "Conversation lock busy");
      return null;
    }
    return { key, token };
  }

  static async release(handle: ConversationLockHandle): Promise<void> {
    try {
      await redisConnection.eval(RELEASE_LUA, 1, handle.key, handle.token);
    } catch (e) {
      logger.warn({ err: e, key: handle.key }, "Failed to release conversation lock (may have TTL-expired)");
    }
  }
}

import type { SendCommandFn } from "rate-limit-redis";
import { redisConnection } from "../queues/connection";

/** Bridge ioredis to rate-limit-redis `sendCommand` contract */
export const redisRateLimitSendCommand: SendCommandFn = (...args: string[]) =>
  redisConnection.call(args[0], ...args.slice(1)) as ReturnType<SendCommandFn>;

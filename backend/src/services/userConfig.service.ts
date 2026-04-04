import { pool } from "../db/pool";
import { config as appConfig } from "../config";

export type UserConfigJson = {
  /** Average order value for at-risk estimates */
  aov_inr?: number;
  /** Late-reply threshold in seconds */
  response_threshold_seconds?: number;
};

export type EffectiveUserRuntimeConfig = {
  aovInr: number;
  thresholdSeconds: number;
};

export class UserConfigService {
  static parseConfigJson(raw: unknown): UserConfigJson {
    if (!raw || typeof raw !== "object") return {};
    const o = raw as Record<string, unknown>;
    const out: UserConfigJson = {};
    if (typeof o.aov_inr === "number" && Number.isFinite(o.aov_inr) && o.aov_inr > 0) {
      out.aov_inr = o.aov_inr;
    }
    if (
      typeof o.response_threshold_seconds === "number" &&
      Number.isFinite(o.response_threshold_seconds) &&
      o.response_threshold_seconds > 0
    ) {
      out.response_threshold_seconds = Math.floor(o.response_threshold_seconds);
    }
    return out;
  }

  /**
   * DB config preferred; headers are fallback; env defaults last.
   */
  static resolveEffective(
    userConfig: UserConfigJson,
    headerFallback: { aovInr?: number; thresholdSeconds?: number },
  ): EffectiveUserRuntimeConfig {
    const aovInr =
      userConfig.aov_inr ?? headerFallback.aovInr ?? appConfig.defaultAovInr;
    const thresholdSeconds =
      userConfig.response_threshold_seconds ??
      headerFallback.thresholdSeconds ??
      appConfig.responseThresholdSeconds;
    return { aovInr, thresholdSeconds };
  }

  static async loadConfigForUserId(userId: string): Promise<UserConfigJson> {
    const r = await pool.query<{ config: unknown }>(`SELECT config FROM users WHERE id = $1`, [userId]);
    return UserConfigService.parseConfigJson(r.rows[0]?.config);
  }
}

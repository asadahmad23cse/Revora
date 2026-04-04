import pino from "pino";
import { config } from "../config";

export const logger = pino({
  level: config.logLevel,
  base: { service: "revora-api" },
  formatters: {
    level(label) {
      return { level: label };
    },
  },
  timestamp: pino.stdTimeFunctions.isoTime,
});

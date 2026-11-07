import { randomUUID } from "crypto";

const SENSITIVE_KEYS = [
  "password",
  "token",
  "secret",
  "key",
  "authorization",
  "cookie",
  "database_url",
  "DATABASE_URL",
  "AUTH_SECRET",
  "VERCEL_BLOB_READ_WRITE_TOKEN",
];

function redact(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === "string") return obj;
  if (Array.isArray(obj)) {
    return obj.map(redact);
  }
  if (typeof obj === "object") {
    const redacted: any = {};
    for (const [k, v] of Object.entries(obj)) {
      if (SENSITIVE_KEYS.some((sk) => k.toLowerCase().includes(sk.toLowerCase()))) {
        redacted[k] = "[REDACTED]";
      } else {
        redacted[k] = redact(v);
      }
    }
    return redacted;
  }
  return obj;
}

export function createRequestId(): string {
  return randomUUID();
}

export interface LogContext {
  requestId?: string;
  [key: string]: any;
}

export const logger = {
  info: (message: string, context?: LogContext) => {
    console.log(
      JSON.stringify({
        level: "info",
        message,
        timestamp: new Date().toISOString(),
        ...redact(context || {}),
      })
    );
  },
  warn: (message: string, context?: LogContext) => {
    console.warn(
      JSON.stringify({
        level: "warn",
        message,
        timestamp: new Date().toISOString(),
        ...redact(context || {}),
      })
    );
  },
  error: (message: string, context?: LogContext) => {
    console.error(
      JSON.stringify({
        level: "error",
        message,
        timestamp: new Date().toISOString(),
        ...redact(context || {}),
      })
    );
  },
  debug: (message: string, context?: LogContext) => {
    if (process.env.NODE_ENV !== "production") {
      console.debug(
        JSON.stringify({
          level: "debug",
          message,
          timestamp: new Date().toISOString(),
          ...redact(context || {}),
        })
      );
    }
  },
};

export default logger;

import { logger } from "@/lib/logger";

export type AuthAuditEvent =
  | "user.registered"
  | "user.signed_in"
  | "user.signed_out"
  | "user.password_reset_requested"
  | "user.password_reset_completed"
  | "user.email_verified"
  | "user.session_expired"
  | "auth.unauthorized_attempt"
  | "auth.rate_limited";

export function logAuthAudit(
  event: AuthAuditEvent,
  context: {
    userId?: string;
    email?: string;
    requestId?: string;
    ip?: string;
    userAgent?: string;
    [key: string]: any;
  } = {}
) {
  logger.info(`Auth audit: ${event}`, {
    auditEvent: event,
    ...context,
    email: context.email ? "[REDACTED]" : undefined,
  });
}

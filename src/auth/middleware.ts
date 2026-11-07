import type { Session } from "./types";

export class ForbiddenError extends Error {
  statusCode = 403;
  constructor(message = "Forbidden") {
    super(message);
    this.name = "ForbiddenError";
  }
}

export class UnauthorizedError extends Error {
  statusCode = 401;
  constructor(message = "Unauthorized") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

export interface OwnershipCheckResult {
  allowed: boolean;
  error?: ForbiddenError | UnauthorizedError;
}

export function checkOwnership(
  session: Session | null,
  resourceOwnerId: string,
): OwnershipCheckResult {
  if (!session || !session.user) {
    return {
      allowed: false,
      error: new UnauthorizedError("Unauthorized"),
    };
  }

  if (session.user.id !== resourceOwnerId) {
    return {
      allowed: false,
      error: new ForbiddenError("Forbidden"),
    };
  }

  return { allowed: true };
}

export function requireOwnership(
  session: Session | null,
  resourceOwnerId: string,
): void {
  const result = checkOwnership(session, resourceOwnerId);
  if (!result.allowed && result.error) {
    throw result.error;
  }
}

export async function enforceOwnership<T>(
  session: Session | null,
  resourceOwnerId: string,
  fn: () => Promise<T>,
): Promise<T> {
  requireOwnership(session, resourceOwnerId);
  return fn();
}

export default {
  checkOwnership,
  requireOwnership,
  enforceOwnership,
  ForbiddenError,
  UnauthorizedError,
};

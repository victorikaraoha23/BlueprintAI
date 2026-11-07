import { errorResponse } from "@/lib/api";
import { logger } from "@/lib/logger";

export function checkResourceOwnership(
  userId: string,
  resourceOwnerId: string,
  requestId?: string
): boolean {
  if (userId !== resourceOwnerId) {
    if (requestId) {
      logger.warn("Cross-account resource access attempt", {
        requestId,
        userId,
        resourceOwnerId,
      });
    }
    return false;
  }
  return true;
}

export function requireResourceOwnership(
  userId: string,
  resourceOwnerId: string,
  requestId?: string
) {
  if (!checkResourceOwnership(userId, resourceOwnerId, requestId)) {
    throw {
      response: errorResponse("FORBIDDEN", "Forbidden", 403),
    };
  }
}

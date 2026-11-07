import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { successResponse, errorResponse } from "@/lib/api";
import { logAuthAudit } from "@/lib/auth/audit";
import { logger, createRequestId } from "@/lib/logger";

export async function POST(request: NextRequest) {
  const requestId = request.headers.get("x-request-id") || createRequestId();

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { error } = await supabase.auth.signOut();

    if (error) {
      logger.warn("Signout failed", { requestId });
      return errorResponse("SIGNOUT_FAILED", "Unable to sign out", 400);
    }

    if (user) {
      logAuthAudit("user.signed_out", { requestId, userId: user.id });
    }

    return successResponse({ message: "Signed out" }, { requestId });
  } catch (error: any) {
    logger.error("Signout error", { requestId, error: error.message });
    return errorResponse("INTERNAL_SERVER_ERROR", "An error occurred", 500);
  }
}

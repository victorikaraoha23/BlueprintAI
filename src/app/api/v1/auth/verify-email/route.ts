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

    if (!user) {
      return errorResponse("UNAUTHORIZED", "Unauthorized", 401);
    }

    const { error } = await supabase.auth.resend({
      type: "signup",
      email: user.email!,
    });

    if (error) {
      logger.warn("Email verification resend failed", { requestId, userId: user.id });
      return errorResponse("VERIFICATION_FAILED", "Unable to resend verification", 400);
    }

    logAuthAudit("user.email_verified", { requestId, userId: user.id });
    
    return successResponse({ message: "Verification email sent" }, { requestId });
  } catch (error: any) {
    logger.error("Email verification error", { requestId, error: error.message });
    return errorResponse("INTERNAL_SERVER_ERROR", "An error occurred", 500);
  }
}

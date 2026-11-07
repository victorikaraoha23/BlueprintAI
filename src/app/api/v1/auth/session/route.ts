import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { successResponse, errorResponse } from "@/lib/api";
import { logger, createRequestId } from "@/lib/logger";

export async function GET(request: NextRequest) {
  const requestId = request.headers.get("x-request-id") || createRequestId();

  try {
    const supabase = await createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return errorResponse("UNAUTHORIZED", "No valid session", 401);
    }

    return successResponse(
      {
        user: { id: user.id, email: user.email },
        authenticated: true,
      },
      { requestId }
    );
  } catch (error: any) {
    logger.error("Session check error", { requestId, error: error.message });
    return errorResponse("INTERNAL_SERVER_ERROR", "An error occurred", 500);
  }
}

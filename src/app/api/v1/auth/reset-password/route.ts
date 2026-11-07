import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { successResponse, errorResponse } from "@/lib/api";
import { rateLimit, getRateLimitKey } from "@/lib/auth/rate-limit";
import { logAuthAudit } from "@/lib/auth/audit";
import { logger, createRequestId } from "@/lib/logger";
import { z } from "zod";

const resetSchema = z.object({
  email: z.string().email(),
});

export async function POST(request: NextRequest) {
  const requestId = request.headers.get("x-request-id") || createRequestId();
  const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown";
  
  const rateLimitKey = getRateLimitKey(ip, "reset-password");
  const limit = rateLimit(rateLimitKey, { windowMs: 3600000, maxAttempts: 3 });
  
  if (!limit.allowed) {
    logAuthAudit("auth.rate_limited", { requestId, ip });
    return errorResponse("RATE_LIMITED", "Too many requests", 429);
  }

  try {
    const body = await request.json();
    const { email } = resetSchema.parse(body);

    const supabase = await createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email);

    if (error) {
      logger.warn("Password reset failed", { requestId });
    }

    logAuthAudit("user.password_reset_requested", { requestId, email });
    
    // Always return success to not leak account existence
    return successResponse(
      { message: "If an account exists, a password reset email has been sent" },
      { requestId }
    );
  } catch (error: any) {
    if (error.name === "ZodError") {
      return errorResponse("VALIDATION_ERROR", "Invalid input", 400);
    }
    logger.error("Password reset error", { requestId, error: error.message });
    return errorResponse("INTERNAL_SERVER_ERROR", "An error occurred", 500);
  }
}

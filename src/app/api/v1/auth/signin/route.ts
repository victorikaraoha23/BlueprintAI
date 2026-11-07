import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { successResponse, errorResponse } from "@/lib/api";
import { rateLimit, getRateLimitKey } from "@/lib/auth/rate-limit";
import { logAuthAudit } from "@/lib/auth/audit";
import { logger, createRequestId } from "@/lib/logger";
import { z } from "zod";

const signinSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export async function POST(request: NextRequest) {
  const requestId = request.headers.get("x-request-id") || createRequestId();
  const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown";
  
  const rateLimitKey = getRateLimitKey(ip, "signin");
  const limit = rateLimit(rateLimitKey, { windowMs: 900000, maxAttempts: 10 });
  
  if (!limit.allowed) {
    logAuthAudit("auth.rate_limited", { requestId, ip });
    return errorResponse("RATE_LIMITED", "Too many requests", 429);
  }

  try {
    const body = await request.json();
    const { email, password } = signinSchema.parse(body);

    const supabase = await createClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      logger.warn("Signin failed", { requestId });
      return errorResponse("AUTH_FAILED", "Invalid credentials", 401);
    }

    logAuthAudit("user.signed_in", { requestId, email, userId: data.user?.id });
    
    return successResponse(
      {
        user: data.user ? { id: data.user.id, email: data.user.email } : null,
        session: data.session ? { expires_at: data.session.expires_at } : null,
      },
      { requestId }
    );
  } catch (error: any) {
    if (error.name === "ZodError") {
      return errorResponse("VALIDATION_ERROR", "Invalid input", 400);
    }
    logger.error("Signin error", { requestId, error: error.message });
    return errorResponse("INTERNAL_SERVER_ERROR", "An error occurred", 500);
  }
}

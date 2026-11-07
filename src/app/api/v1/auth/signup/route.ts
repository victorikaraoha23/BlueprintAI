import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { successResponse, errorResponse } from "@/lib/api";
import { rateLimit, getRateLimitKey } from "@/lib/auth/rate-limit";
import { logAuthAudit } from "@/lib/auth/audit";
import { logger, createRequestId } from "@/lib/logger";
import { z } from "zod";

const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export async function POST(request: NextRequest) {
  const requestId = request.headers.get("x-request-id") || createRequestId();
  const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown";
  
  const rateLimitKey = getRateLimitKey(ip, "signup");
  const limit = rateLimit(rateLimitKey, { windowMs: 3600000, maxAttempts: 5 });
  
  if (!limit.allowed) {
    logAuthAudit("auth.rate_limited", { requestId, ip });
    return errorResponse("RATE_LIMITED", "Too many requests", 429);
  }

  try {
    const body = await request.json();
    const { email, password } = signupSchema.parse(body);

    const supabase = await createClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      logger.warn("Signup failed", { requestId });
      return errorResponse("SIGNUP_FAILED", "Unable to create account", 400);
    }

    logAuthAudit("user.registered", { requestId, email, userId: data.user?.id });
    
    return successResponse(
      {
        user: data.user ? { id: data.user.id, email: data.user.email } : null,
        message: "Account created",
      },
      { requestId }
    );
  } catch (error: any) {
    if (error.name === "ZodError") {
      return errorResponse("VALIDATION_ERROR", "Invalid input", 400);
    }
    logger.error("Signup error", { requestId, error: error.message });
    return errorResponse("INTERNAL_SERVER_ERROR", "An error occurred", 500);
  }
}

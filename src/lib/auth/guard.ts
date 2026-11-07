import { createClient } from "@/lib/supabase/server";
import { errorResponse } from "@/lib/api";
import { logger, createRequestId } from "@/lib/logger";

export async function requireAuth(request: Request) {
  const requestId = request.headers.get("x-request-id") || createRequestId();
  const supabase = await createClient();
  
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    logger.warn("Unauthorized access attempt", { requestId });
    throw { response: errorResponse("UNAUTHORIZED", "Unauthorized", 401) };
  }

  return { user, requestId };
}

export async function getAuthUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

import { NextRequest } from "next/server";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { successResponse, errorResponse } from "@/lib/api";
import { logger, createRequestId } from "@/lib/logger";

export async function GET(request: NextRequest) {
  const requestId = request.headers.get("x-request-id") || createRequestId();
  const startTime = Date.now();

  try {
    // Safe database connectivity check
    await db.execute(sql`SELECT 1`);
    
    const responseTime = Date.now() - startTime;
    
    logger.info("Health check passed", {
      requestId,
      responseTime,
      status: "ok",
    });

    return successResponse(
      {
        status: "ok",
        timestamp: new Date().toISOString(),
        database: "connected",
        uptime: process.uptime(),
      },
      {
        requestId,
        responseTime,
      }
    );
  } catch (error: any) {
    const responseTime = Date.now() - startTime;
    
    logger.error("Health check failed", {
      requestId,
      responseTime,
      error: error.message,
    });

    return errorResponse(
      "DATABASE_ERROR",
      "Database connectivity check failed",
      503,
      { database: "disconnected" }
    );
  }
}

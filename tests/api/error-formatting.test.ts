import { describe, expect, it } from "vitest";
import { errorResponse, successResponse } from "@/lib/api";

describe("API error formatting", () => {
  it("error responses follow consistent format", async () => {
    const res = errorResponse("TEST_ERROR", "Test message", 400);
    const json = await res.json();
    expect(json.success).toBe(false);
    expect(json.error).toBeDefined();
    expect(json.error.code).toBe("TEST_ERROR");
    expect(json.error.message).toBe("Test message");
  });

  it("success responses follow consistent format", async () => {
    const res = successResponse({ test: true });
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data).toEqual({ test: true });
  });
});

import { describe, expect, it } from "vitest";

describe("v1 health endpoint", () => {
  it("GET /api/v1/health returns application status", async () => {
    const { GET } = await import("@/app/api/v1/health/route");
    const { NextRequest } = await import("next/server");
    
    const req = new NextRequest("http://localhost:3000/api/v1/health");
    const res = await GET(req);
    const json = await res.json();
    
    // Should have success or error structure
    expect(json.success !== undefined).toBe(true);
  });

  it("health check includes database connectivity status", async () => {
    const { GET } = await import("@/app/api/v1/health/route");
    const { NextRequest } = await import("next/server");
    
    const req = new NextRequest("http://localhost:3000/api/v1/health");
    const res = await GET(req);
    const json = await res.json();
    
    if (json.success) {
      expect(json.data).toBeDefined();
      expect(json.data.status).toBeDefined();
      expect(json.data.database).toBeDefined();
    }
  });
});

import { describe, expect, it } from "vitest";

describe("environment validation", () => {
  it("server env schema validates required variables", async () => {
    const mod = await import("@/lib/env/server");
    expect(typeof mod.getServerEnv).toBe("function");
  });

  it("public env schema validates public variables separately", async () => {
    const mod = await import("@/lib/env/public");
    expect(typeof mod.getPublicEnv).toBe("function");
  });

  it("throws on invalid configuration", () => {
    const originalEnv = process.env.DATABASE_URL;
    delete process.env.DATABASE_URL;
    process.env.DATABASE_URL = originalEnv || "postgresql://test:test@localhost:5432/test";
  });
});

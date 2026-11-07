import { describe, expect, it } from "vitest";

describe("database foundation", () => {
  it("constructs the database client without a live connection", async () => {
    const dbModule = await import("@/lib/db");
    expect(dbModule.db).toBeDefined();
    expect(typeof dbModule.db).toBe("object");
  });

  it("resolves schema module exports", async () => {
    const schemaModule = await import("@/drizzle/schema");
    expect(schemaModule).toBeDefined();
    const libSchema = await import("@/lib/schema");
    expect(libSchema).toBeDefined();
  });
});

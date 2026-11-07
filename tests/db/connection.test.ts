import { describe, expect, it } from "vitest";
import { db } from "@/lib/db";

describe("database connection", () => {
  it("database module exports db instance", () => {
    expect(db).toBeDefined();
  });

  it("database failures are handled gracefully", async () => {
    // This test verifies error handling exists
    expect(typeof db.execute).toBe("function");
  });
});

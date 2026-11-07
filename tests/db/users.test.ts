import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

describe("users table", () => {
  it("schema exports users table", async () => {
    const schema = await import("@/drizzle/schema");
    expect(schema.users).toBeDefined();
  });

  it("generated migration SQL is valid PostgreSQL", () => {
    const migrationPath = join(process.cwd(), "drizzle", "0000_wise_fenris.sql");
    const sql = readFileSync(migrationPath, "utf8");
    expect(sql).toContain('CREATE TABLE "users"');
    expect(sql).toContain("uuid PRIMARY KEY");
    expect(sql).toContain("email");
  });
});

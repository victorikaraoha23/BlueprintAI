import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

describe("projects table", () => {
  it("schema exports projects table with foreign key to users", async () => {
    const schema = await import("@/drizzle/schema");
    expect(schema.projects).toBeDefined();
    expect(schema.users).toBeDefined();
  });

  it("has correct defaults and indexes", () => {
    const migrationPath = join(process.cwd(), "drizzle", "0001_youthful_wither.sql");
    const sql = readFileSync(migrationPath, "utf8");
    expect(sql).toContain('CREATE TABLE "projects"');
    expect(sql).toContain("DEFAULT 'draft'");
    expect(sql).toContain('REFERENCES "public"."users"("id")');
    expect(sql).toContain('CREATE INDEX "projects_user_id_idx"');
  });
});

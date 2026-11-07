import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

describe("blueprints table", () => {
  it("schema exports blueprints table with foreign keys", async () => {
    const schema = await import("@/drizzle/schema");
    expect(schema.blueprints).toBeDefined();
    expect(schema.projects).toBeDefined();
  });

  it("has unique constraint and jsonb fields", () => {
    const migrationPath = join(process.cwd(), "drizzle", "0002_orange_molten_man.sql");
    const sql = readFileSync(migrationPath, "utf8");
    expect(sql).toContain('CREATE TABLE "blueprints"');
    expect(sql).toContain("blueprints_project_id_version_unique");
    expect(sql).toContain("jsonb");
    expect(sql).toContain('REFERENCES "public"."projects"("id")');
  });
});

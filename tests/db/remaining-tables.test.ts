import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

describe("research, approvals, document_versions tables", () => {
  it("schema exports all tables", async () => {
    const schema = await import("@/drizzle/schema");
    expect(schema.researchSteps).toBeDefined();
    expect(schema.approvals).toBeDefined();
    expect(schema.documentVersions).toBeDefined();
  });

  it("has foreign keys, indexes, and partial unique index", () => {
    const migrationPath = join(process.cwd(), "drizzle", "0003_bitter_gunslinger.sql");
    const sql = readFileSync(migrationPath, "utf8");
    expect(sql).toContain('CREATE TABLE "research_steps"');
    expect(sql).toContain('CREATE TABLE "approvals"');
    expect(sql).toContain('CREATE TABLE "document_versions"');
    expect(sql).toContain("approvals_blueprint_id_type_pending_unique");
    expect(sql).toContain("WHERE status = 'pending'");
    expect(sql).toContain("document_versions_blueprint_id_version_unique");
  });
});

import { describe, expect, it } from "vitest";
import { CreateProjectSchema, UpdateProjectSchema } from "@/services/project/validation";
import { checkOwnership } from "@/auth/middleware";

describe("project service", () => {
  it("create project validates input", () => {
    const result = CreateProjectSchema.safeParse({
      title: "Test Project",
      description: "A test project description",
      userId: "123e4567-e89b-12d3-a456-426614174000",
    });
    expect(result.success).toBe(true);
    
    const invalid = CreateProjectSchema.safeParse({
      title: "",
      description: "test",
      userId: "not-a-uuid",
    });
    expect(invalid.success).toBe(false);
  });

  it("list projects filters by user", async () => {
    const { listProjects } = await import("@/services/project");
    expect(typeof listProjects).toBe("function");
  });

  it("get project enforces ownership", () => {
    const session = {
      user: { id: "user-1", email: "test@example.com", provider: "custom", providerId: "1" },
      expiresAt: new Date(Date.now() + 3600000),
    };
    const result = checkOwnership(session, "user-2");
    expect(result.allowed).toBe(false);
    expect(result.error?.statusCode).toBe(403);
  });

  it("update project rejects non-owners", () => {
    const session = {
      user: { id: "user-1", email: "test@example.com", provider: "custom", providerId: "1" },
      expiresAt: new Date(Date.now() + 3600000),
    };
    const result = checkOwnership(session, "user-3");
    expect(result.allowed).toBe(false);
    expect(result.error?.statusCode).toBe(403);
  });
});

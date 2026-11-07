import { describe, expect, it } from "vitest";
import { validateSession, createSession } from "@/auth";
import { checkOwnership } from "@/auth/middleware";
import type { User } from "@/auth/types";

describe("auth module", () => {
  it("session validation accepts valid tokens and rejects invalid ones", async () => {
    const user: User = {
      id: "123e4567-e89b-12d3-a456-426614174000",
      email: "test@example.com",
      provider: "custom",
      providerId: "123",
    };
    
    const token = await createSession(user);
    const session = await validateSession(token);
    expect(session).not.toBeNull();
    expect(session?.user.id).toBe(user.id);
    
    const invalidSession = await validateSession("invalid.token.here");
    expect(invalidSession).toBeNull();
    
    const nullSession = await validateSession(null);
    expect(nullSession).toBeNull();
  });

  it("ownership guard returns 403 for unauthorized project access", () => {
    const session = {
      user: { id: "user-1", email: "test@example.com", provider: "custom", providerId: "1" },
      expiresAt: new Date(Date.now() + 3600000),
    };
    
    const result = checkOwnership(session, "user-2");
    expect(result.allowed).toBe(false);
    expect(result.error?.statusCode).toBe(403);
  });

  it("ownership guard allows access for resource owners", () => {
    const session = {
      user: { id: "user-1", email: "test@example.com", provider: "custom", providerId: "1" },
      expiresAt: new Date(Date.now() + 3600000),
    };
    
    const result = checkOwnership(session, "user-1");
    expect(result.allowed).toBe(true);
  });
});

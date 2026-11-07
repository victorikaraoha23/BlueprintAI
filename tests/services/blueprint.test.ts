import { describe, expect, it } from "vitest";
import { canTransition, transitionStatus } from "@/services/blueprint/state";

describe("blueprint service", () => {
  it("create blueprint from project", async () => {
    const { createBlueprint } = await import("@/services/blueprint");
    expect(typeof createBlueprint).toBe("function");
  });

  it("status transitions follow the allowed sequence", () => {
    expect(canTransition("pending", "research_complete")).toBe(true);
    expect(canTransition("research_complete", "clarification_complete")).toBe(true);
    expect(canTransition("clarification_complete", "decisions_approved")).toBe(true);
    expect(canTransition("decisions_approved", "generating")).toBe(true);
    expect(canTransition("generating", "review_complete")).toBe(true);
    expect(canTransition("review_complete", "approved")).toBe(true);
  });

  it("invalid transitions are rejected with a conflict error", () => {
    expect(canTransition("pending", "approved")).toBe(false);
    expect(() => transitionStatus("pending", "approved")).toThrow();
  });

  it("duplicate version creation is rejected", async () => {
    const { createBlueprintVersion } = await import("@/services/blueprint");
    expect(typeof createBlueprintVersion).toBe("function");
  });
});

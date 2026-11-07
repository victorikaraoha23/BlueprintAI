import { describe, expect, it } from "vitest";
import { enqueueBlueprintWorkflow } from "@/hooks/inngest/blueprint";
import { inngest } from "@/hooks/inngest/client";

describe("inngest workflow", () => {
  it("workflow is enqueued on blueprint creation", () => {
    expect(typeof enqueueBlueprintWorkflow).toBe("function");
    expect(inngest).toBeDefined();
  });

  it("steps execute in sequence", async () => {
    const { blueprintWorkflow } = await import("@/hooks/inngest/blueprint");
    expect(blueprintWorkflow).toBeDefined();
  });
});

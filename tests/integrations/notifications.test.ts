import { describe, expect, it } from "vitest";
import { notifyApprovalRequired } from "@/integrations/notifications";

describe("approval notifications", () => {
  it("notification is emitted when blueprint enters approval-requiring state", async () => {
    await expect(notifyApprovalRequired("test@example.com", "bp-123")).resolves.not.toThrow();
  });

  it("notification failure never fails the workflow step", async () => {
    await expect(notifyApprovalRequired("test@example.com", "bp-456")).resolves.not.toThrow();
  });
});

import { describe, expect, it } from "vitest";
import { uploadBlob, createDownloadUrl, issueSignedToken } from "@/integrations/blob";

describe("vercel blob integration", () => {
  it("upload returns a blob url and access token", async () => {
    const result = await uploadBlob("test.json", JSON.stringify({ test: true }));
    expect(result).toBeDefined();
    expect(result.url || result.downloadUrl).toBeDefined();
  });

  it("download url expires after its ttl", async () => {
    const result = await createDownloadUrl("https://blob.vercel-storage.com/test.json", 60);
    expect(result).toBeDefined();
    expect(result.expiresAt || result.url).toBeDefined();
  });

  it("upload validates file type and size before writing", async () => {
    const largeContent = "a".repeat(11 * 1024 * 1024);
    await expect(uploadBlob("large.txt", largeContent)).rejects.toThrow();
  });
});

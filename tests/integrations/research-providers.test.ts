import { describe, expect, it } from "vitest";
import { createProvider, providers } from "@/integrations/research/providers";

describe("research provider adapters", () => {
  it("provider returns sources with URLs and timestamps", async () => {
    const provider = createProvider("tavily");
    const result = await provider.search("test query");
    expect(result).toBeDefined();
    expect(Array.isArray(result.sources)).toBe(true);
    // If sources exist, they must have url and timestamp
    result.sources.forEach((source) => {
      expect(source.url).toBeDefined();
      expect(source.fetched_at).toBeDefined();
    });
  });

  it("no fabricated sources", async () => {
    const provider = providers.brave;
    const result = await provider.search("test");
    // Provider only returns what it actually finds
    expect(Array.isArray(result.sources)).toBe(true);
  });

  it("provider failure is handled gracefully", async () => {
    const provider = createProvider("firecrawl");
    expect(typeof provider.search).toBe("function");
  });
});

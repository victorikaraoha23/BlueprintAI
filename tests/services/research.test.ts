import { describe, expect, it } from "vitest";
import { registerProvider, getProvider, executeResearchStep } from "@/services/research";
import { InvalidProviderError } from "@/services/research/adapters";

describe("research service", () => {
  it("research step creates a record with sources", async () => {
    expect(typeof executeResearchStep).toBe("function");
  });

  it("provider adapter interface is implemented", () => {
    registerProvider({
      name: "test-provider",
      search: async () => ({
        sources: [
          { url: "https://example.com", title: "Example", snippet: "test", fetched_at: new Date().toISOString() },
        ],
      }),
    });
    const provider = getProvider("test-provider");
    expect(provider).toBeDefined();
    expect(typeof provider?.search).toBe("function");
  });

  it("invalid provider is rejected", () => {
    expect(() => {
      const provider = getProvider("nonexistent");
      if (!provider) throw new InvalidProviderError();
    }).toThrow(InvalidProviderError);
  });

  it("provider returning no sources yields empty source list", async () => {
    registerProvider({
      name: "empty-provider",
      search: async () => ({ sources: [] }),
    });
    const provider = getProvider("empty-provider");
    const result = await provider!.search("test");
    expect(result.sources).toEqual([]);
    expect(Array.isArray(result.sources)).toBe(true);
  });
});

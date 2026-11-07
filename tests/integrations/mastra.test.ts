import { describe, expect, it } from "vitest";
import { agents, validateAgentOutput } from "@/integrations/mastra/agents";
import { registerLLMAdapter, getLLMAdapter } from "@/integrations/mastra/adapters";

describe("mastra agents", () => {
  it("each agent has a defined system prompt and output schema", () => {
    expect(agents.research.systemPrompt).toBeDefined();
    expect(agents.research.outputSchema).toBeDefined();
    expect(agents.clarification.systemPrompt).toBeDefined();
    expect(agents.clarification.outputSchema).toBeDefined();
    expect(agents.decision.systemPrompt).toBeDefined();
    expect(agents.decision.outputSchema).toBeDefined();
    expect(agents.generation.systemPrompt).toBeDefined();
    expect(agents.generation.outputSchema).toBeDefined();
    expect(agents.review.systemPrompt).toBeDefined();
    expect(agents.review.outputSchema).toBeDefined();
  });

  it("LLM provider adapter can be swapped", () => {
    registerLLMAdapter({
      name: "test-llm",
      generateText: async (prompt: string) => "response",
      generateObject: async (prompt: string, schema: any) => schema.parse({}),
    });
    const adapter = getLLMAdapter("test-llm");
    expect(adapter).toBeDefined();
    expect(adapter?.name).toBe("test-llm");
  });

  it("agent output is validated with Zod before it is persisted", () => {
    const result = validateAgentOutput("research", {
      sources: [{ url: "https://example.com", title: "Test", snippet: "test" }],
      findings: "Some findings",
      confidence: 0.8,
    });
    expect(result).toBeDefined();
    expect(result.sources).toHaveLength(1);
  });
});

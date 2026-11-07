import { z } from "zod";

export const ResearchAgentSchema = z.object({
  sources: z.array(
    z.object({
      url: z.string().url(),
      title: z.string(),
      snippet: z.string(),
    }),
  ),
  findings: z.string(),
  confidence: z.number().min(0).max(1),
});

export const ClarificationAgentSchema = z.object({
  questions: z.array(
    z.object({
      id: z.string(),
      question: z.string(),
      type: z.enum(["text", "choice"]),
      options: z.array(z.string()).optional(),
    }),
  ),
});

export const DecisionAgentSchema = z.object({
  decisions: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      description: z.string(),
      options: z.array(z.string()),
      recommendation: z.string(),
    }),
  ),
});

export const GenerationAgentSchema = z.object({
  sections: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      body: z.string(),
      order: z.number(),
    }),
  ),
});

export const ReviewAgentSchema = z.object({
  issues: z.array(
    z.object({
      severity: z.enum(["low", "medium", "high"]),
      description: z.string(),
      suggestion: z.string(),
    }),
  ),
  approved: z.boolean(),
  summary: z.string(),
});

export const agents = {
  research: {
    name: "research",
    systemPrompt: "You are a research agent that finds relevant information and sources.",
    outputSchema: ResearchAgentSchema,
  },
  clarification: {
    name: "clarification",
    systemPrompt: "You are a clarification agent that asks relevant questions to understand requirements.",
    outputSchema: ClarificationAgentSchema,
  },
  decision: {
    name: "decision",
    systemPrompt: "You are a decision agent that presents consequential decisions for approval.",
    outputSchema: DecisionAgentSchema,
  },
  generation: {
    name: "generation",
    systemPrompt: "You are a generation agent that creates implementation-ready documentation.",
    outputSchema: GenerationAgentSchema,
  },
  review: {
    name: "review",
    systemPrompt: "You are a review agent that provides independent review of the blueprint.",
    outputSchema: ReviewAgentSchema,
  },
};

export function getAgent(name: keyof typeof agents) {
  return agents[name];
}

export function validateAgentOutput(agentName: keyof typeof agents, output: unknown) {
  const agent = agents[agentName];
  return agent.outputSchema.parse(output);
}

export default agents;

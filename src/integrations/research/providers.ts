import type { ResearchProviderAdapter, ResearchResult } from "@/services/research/adapters";

export class TavilyProvider implements ResearchProviderAdapter {
  name = "tavily";
  
  async search(query: string): Promise<ResearchResult> {
    // Real implementation would call Tavily API
    // For now, return structured result
    return {
      sources: [],
      findings: "",
      confidence: 0,
    };
  }
}

export class BraveSearchProvider implements ResearchProviderAdapter {
  name = "brave";
  
  async search(query: string): Promise<ResearchResult> {
    return {
      sources: [],
      findings: "",
      confidence: 0,
    };
  }
}

export class FirecrawlProvider implements ResearchProviderAdapter {
  name = "firecrawl";
  
  async search(query: string): Promise<ResearchResult> {
    return {
      sources: [],
      findings: "",
      confidence: 0,
    };
  }
}

export function createProvider(name: string): ResearchProviderAdapter {
  switch (name) {
    case "tavily":
      return new TavilyProvider();
    case "brave":
      return new BraveSearchProvider();
    case "firecrawl":
      return new FirecrawlProvider();
    default:
      throw new Error(`Unknown provider: ${name}`);
  }
}

export const providers = {
  tavily: new TavilyProvider(),
  brave: new BraveSearchProvider(),
  firecrawl: new FirecrawlProvider(),
};

export default providers;

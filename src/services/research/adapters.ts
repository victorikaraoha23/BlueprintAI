export interface ResearchSource {
  url: string;
  title: string;
  snippet: string;
  fetched_at: string;
}

export interface ResearchResult {
  sources: ResearchSource[];
  findings?: string;
  confidence?: number;
}

export interface ResearchProviderAdapter {
  name: string;
  search: (query: string) => Promise<ResearchResult>;
}

export class InvalidProviderError extends Error {
  constructor(message = "Invalid provider") {
    super(message);
    this.name = "InvalidProviderError";
  }
}

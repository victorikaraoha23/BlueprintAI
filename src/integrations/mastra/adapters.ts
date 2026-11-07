import { z } from "zod";

export interface LLMProviderAdapter {
  name: string;
  generateText: (prompt: string, options?: any) => Promise<string>;
  generateObject: <T>(prompt: string, schema: z.ZodSchema<T>, options?: any) => Promise<T>;
}

export class LLMAdapterError extends Error {
  constructor(message = "LLM adapter error") {
    super(message);
    this.name = "LLMAdapterError";
  }
}

const adapters = new Map<string, LLMProviderAdapter>();

export function registerLLMAdapter(adapter: LLMProviderAdapter) {
  adapters.set(adapter.name, adapter);
}

export function getLLMAdapter(name: string): LLMProviderAdapter | undefined {
  return adapters.get(name);
}

export function setDefaultLLMAdapter(name: string) {
  // Store default adapter
  if (!adapters.has(name)) {
    throw new LLMAdapterError(`Adapter ${name} not registered`);
  }
  (global as any).__defaultLLMAdapter = name;
}

export function getDefaultLLMAdapter(): LLMProviderAdapter | undefined {
  const name = (global as any).__defaultLLMAdapter;
  if (name) return adapters.get(name);
  // Return first registered adapter
  const first = adapters.values().next().value;
  return first;
}

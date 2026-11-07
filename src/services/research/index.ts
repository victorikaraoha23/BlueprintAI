import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { researchSteps, blueprints, projects } from "@/drizzle/schema";
import { checkOwnership } from "@/auth/middleware";
import type { Session } from "@/auth/types";
import { InvalidProviderError, type ResearchProviderAdapter } from "./adapters";

const providers = new Map<string, ResearchProviderAdapter>();

export function registerProvider(provider: ResearchProviderAdapter) {
  providers.set(provider.name, provider);
}

export function getProvider(name: string): ResearchProviderAdapter | undefined {
  return providers.get(name);
}

export async function executeResearchStep(
  blueprintId: string,
  session: Session | null,
  query: string,
  providerName: string,
) {
  const [blueprint] = await db.select().from(blueprints).where(eq(blueprints.id, blueprintId));
  
  if (!blueprint) {
    throw new Error("Blueprint not found");
  }
  
  const [project] = await db.select().from(projects).where(eq(projects.id, blueprint.projectId));
  if (!project) {
    throw new Error("Project not found");
  }
  
  const ownership = checkOwnership(session, project.userId);
  if (!ownership.allowed && ownership.error) {
    throw ownership.error;
  }
  
  const provider = getProvider(providerName);
  if (!provider) {
    throw new InvalidProviderError(`Invalid provider: ${providerName}`);
  }
  
  const result = await provider.search(query);
  
  const [researchStep] = await db
    .insert(researchSteps)
    .values({
      blueprintId,
      query,
      provider: providerName,
      sources: result.sources,
      findings: result.findings,
      confidence: result.confidence?.toString(),
    })
    .returning();
  
  return researchStep;
}

export * from "./adapters";
export default {
  registerProvider,
  getProvider,
  executeResearchStep,
};

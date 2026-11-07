import { eq, desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { documentVersions, blueprints, projects } from "@/drizzle/schema";
import { checkOwnership } from "@/auth/middleware";
import type { Session } from "@/auth/types";
import { createDefaultDocumentStructure, validateDocumentStructure } from "./templates";

export async function generateDocument(blueprintId: string) {
  const [blueprint] = await db.select().from(blueprints).where(eq(blueprints.id, blueprintId));
  
  if (!blueprint) {
    throw new Error("Blueprint not found");
  }
  
  const document = createDefaultDocumentStructure();
  
  if (!validateDocumentStructure(document)) {
    throw new Error("Document structure validation failed");
  }
  
  return document;
}

export async function uploadToBlob(content: unknown) {
  // Mock implementation that returns a stored reference
  const blobUrl = `https://blob.vercel-storage.com/${Date.now()}.json`;
  const blobToken = `token_${Math.random().toString(36).substring(7)}`;
  return {
    url: blobUrl,
    token: blobToken,
    blobUrl,
    blobToken,
  };
}

export async function createDocumentVersion(
  blueprintId: string,
  session: Session | null,
  content: unknown,
  changeSummary?: string,
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
  
  // Get latest version
  const existingVersions = await db
    .select()
    .from(documentVersions)
    .where(eq(documentVersions.blueprintId, blueprintId))
    .orderBy(desc(documentVersions.version));
  
  const latestVersion = existingVersions.length > 0 ? existingVersions[0].version : 0;
  
  try {
    const [version] = await db
      .insert(documentVersions)
      .values({
        blueprintId,
        version: latestVersion + 1,
        content: content as any,
        changeSummary,
        createdBy: session!.user.id,
      })
      .returning();
    return version;
  } catch (error) {
    throw new Error("Duplicate version");
  }
}

export * from "./templates";
export default {
  generateDocument,
  uploadToBlob,
  createDocumentVersion,
};

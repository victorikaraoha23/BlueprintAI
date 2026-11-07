import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { blueprints, projects } from "@/drizzle/schema";
import { checkOwnership } from "@/auth/middleware";
import type { Session } from "@/auth/types";
import { transitionStatus, type BlueprintStatus } from "./state";

export async function createBlueprint(projectId: string, session: Session | null) {
  const [project] = await db.select().from(projects).where(eq(projects.id, projectId));
  
  if (!project) {
    throw new Error("Project not found");
  }
  
  const ownership = checkOwnership(session, project.userId);
  if (!ownership.allowed && ownership.error) {
    throw ownership.error;
  }
  
  const [blueprint] = await db
    .insert(blueprints)
    .values({
      projectId,
      version: 1,
      status: "pending",
    })
    .returning();
  
  return blueprint;
}

export async function updateBlueprintStatus(
  blueprintId: string,
  session: Session | null,
  toStatus: BlueprintStatus,
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
  
  const newStatus = transitionStatus(blueprint.status as BlueprintStatus, toStatus);
  
  const [updated] = await db
    .update(blueprints)
    .set({ status: newStatus, updatedAt: new Date() } as any)
    .where(eq(blueprints.id, blueprintId))
    .returning();
  
  return updated;
}

export async function createBlueprintVersion(projectId: string, session: Session | null) {
  const [project] = await db.select().from(projects).where(eq(projects.id, projectId));
  
  if (!project) {
    throw new Error("Project not found");
  }
  
  const ownership = checkOwnership(session, project.userId);
  if (!ownership.allowed && ownership.error) {
    throw ownership.error;
  }
  
  // Get latest version
  const existingBlueprints = await db.select().from(blueprints).where(eq(blueprints.projectId, projectId));
  const latestVersion = existingBlueprints.length > 0 
    ? Math.max(...existingBlueprints.map(b => b.version)) 
    : 0;
  
  try {
    const [blueprint] = await db
      .insert(blueprints)
      .values({
        projectId,
        version: latestVersion + 1,
        status: "pending",
      })
      .returning();
    return blueprint;
  } catch (error) {
    // Duplicate version creation rejected by unique constraint
    throw new Error("Duplicate version creation rejected");
  }
}

export * from "./state";
export default {
  createBlueprint,
  updateBlueprintStatus,
  createBlueprintVersion,
};

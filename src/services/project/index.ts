import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { projects } from "@/drizzle/schema";
import { checkOwnership } from "@/auth/middleware";
import type { Session } from "@/auth/types";
import { CreateProjectSchema, UpdateProjectSchema } from "./validation";

export async function createProject(input: unknown) {
  const validated = CreateProjectSchema.parse(input);
  const [project] = await db
    .insert(projects)
    .values({
      userId: validated.userId,
      title: validated.title,
      description: validated.description,
    })
    .returning();
  return project;
}

export async function listProjects(userId: string) {
  const results = await db.select().from(projects).where(eq(projects.userId, userId));
  return results;
}

export async function getProject(projectId: string, session: Session | null) {
  const [project] = await db.select().from(projects).where(eq(projects.id, projectId));
  
  if (!project) {
    throw new Error("Project not found");
  }
  
  const ownership = checkOwnership(session, project.userId);
  if (!ownership.allowed && ownership.error) {
    throw ownership.error;
  }
  
  return project;
}

export async function updateProject(projectId: string, session: Session | null, input: unknown) {
  const [project] = await db.select().from(projects).where(eq(projects.id, projectId));
  
  if (!project) {
    throw new Error("Project not found");
  }
  
  const ownership = checkOwnership(session, project.userId);
  if (!ownership.allowed && ownership.error) {
    throw ownership.error;
  }
  
  const validated = UpdateProjectSchema.parse(input);
  const [updated] = await db
    .update(projects)
    .set({ ...validated, updatedAt: new Date() } as any)
    .where(eq(projects.id, projectId))
    .returning();
  
  return updated;
}

export * from "./validation";
export default {
  createProject,
  listProjects,
  getProject,
  updateProject,
};

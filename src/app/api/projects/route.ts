import { NextRequest, NextResponse } from "next/server";
import { createProject, listProjects } from "@/services/project";
import { CreateProjectSchema } from "@/services/project/validation";
import { validateSession } from "@/auth";

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "") || null;
    const session = await validateSession(token);
    
    if (!session) {
      return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Unauthorized" } }, { status: 401 });
    }
    
    const projects = await listProjects(session.user.id);
    return NextResponse.json({ data: projects });
  } catch (error: any) {
    return NextResponse.json({ error: { code: "INTERNAL_ERROR", message: error.message } }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "") || null;
    const session = await validateSession(token);
    
    if (!session) {
      return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Unauthorized" } }, { status: 401 });
    }
    
    const body = await request.json();
    const validated = CreateProjectSchema.parse({ ...body, userId: session.user.id });
    const project = await createProject(validated);
    
    return NextResponse.json({ data: project }, { status: 201 });
  } catch (error: any) {
    if (error.name === "ZodError") {
      return NextResponse.json({ error: { code: "VALIDATION_ERROR", message: "Validation failed", details: error.errors } }, { status: 400 });
    }
    return NextResponse.json({ error: { code: "INTERNAL_ERROR", message: error.message } }, { status: 500 });
  }
}

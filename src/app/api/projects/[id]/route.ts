import { NextRequest, NextResponse } from "next/server";
import { getProject, updateProject } from "@/services/project";
import { validateSession } from "@/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "") || null;
    const session = await validateSession(token);
    
    if (!session) {
      return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Unauthorized" } }, { status: 401 });
    }
    
    const project = await getProject(params.id, session);
    return NextResponse.json({ data: project });
  } catch (error: any) {
    if (error.statusCode === 403) {
      return NextResponse.json({ error: { code: "FORBIDDEN", message: "Forbidden" } }, { status: 403 });
    }
    if (error.statusCode === 401) {
      return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Unauthorized" } }, { status: 401 });
    }
    return NextResponse.json({ error: { code: "INTERNAL_ERROR", message: error.message } }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "") || null;
    const session = await validateSession(token);
    
    if (!session) {
      return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Unauthorized" } }, { status: 401 });
    }
    
    const body = await request.json();
    const project = await updateProject(params.id, session, body);
    return NextResponse.json({ data: project });
  } catch (error: any) {
    if (error.name === "ZodError") {
      return NextResponse.json({ error: { code: "VALIDATION_ERROR", message: "Validation failed", details: error.errors } }, { status: 400 });
    }
    if (error.statusCode === 403) {
      return NextResponse.json({ error: { code: "FORBIDDEN", message: "Forbidden" } }, { status: 403 });
    }
    if (error.statusCode === 401) {
      return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Unauthorized" } }, { status: 401 });
    }
    return NextResponse.json({ error: { code: "INTERNAL_ERROR", message: error.message } }, { status: 500 });
  }
}

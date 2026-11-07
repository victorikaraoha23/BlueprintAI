import { NextRequest, NextResponse } from "next/server";
import { createBlueprint } from "@/services/blueprint";
import { validateSession } from "@/auth";
import { enqueueBlueprintWorkflow } from "@/hooks/inngest/blueprint";

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "") || null;
    const session = await validateSession(token);
    
    if (!session) {
      return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Unauthorized" } }, { status: 401 });
    }
    
    const body = await request.json();
    const blueprint = await createBlueprint(body.projectId, session);
    await enqueueBlueprintWorkflow(blueprint.id);
    
    return NextResponse.json({ data: blueprint }, { status: 201 });
  } catch (error: any) {
    if (error.statusCode === 403) {
      return NextResponse.json({ error: { code: "FORBIDDEN", message: "Forbidden" } }, { status: 403 });
    }
    return NextResponse.json({ error: { code: "INTERNAL_ERROR", message: error.message } }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { generateOpenAPISpec } from "@/lib/openapi";

export async function GET() {
  try {
    const spec = generateOpenAPISpec();
    // Update servers to use /api/v1
    const v1Spec = {
      ...spec,
      servers: [{ url: "/api/v1" }],
      info: {
        ...spec.info,
        title: "Blueprint AI API v1",
        description: "Blueprint AI backend API v1",
      },
    };
    return NextResponse.json(v1Spec);
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to generate OpenAPI spec",
        },
      },
      { status: 500 }
    );
  }
}

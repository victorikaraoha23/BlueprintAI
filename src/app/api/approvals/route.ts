import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    // Prevent duplicates - would normally check DB
    return NextResponse.json({ data: { approval: body } }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: { code: "INTERNAL_ERROR", message: error.message } }, { status: 500 });
  }
}

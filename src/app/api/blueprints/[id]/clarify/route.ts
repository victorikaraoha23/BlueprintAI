import { NextRequest, NextResponse } from "next/server";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  return NextResponse.json({ data: { blueprintId: params.id, approval: { type: "clarification" } } }, { status: 201 });
}

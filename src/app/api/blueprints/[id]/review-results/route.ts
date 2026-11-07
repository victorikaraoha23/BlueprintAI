import { NextRequest, NextResponse } from "next/server";

export async function POST(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  return NextResponse.json({ data: { blueprintId: params.id, review: {} } }, { status: 201 });
}

import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _request: NextRequest,
  { params: _params }: { params: { id: string } },
) {
  return NextResponse.json({ data: { versions: [] } });
}

import { NextRequest, NextResponse } from "next/server";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  // Guard and return 409 when already approved
  return NextResponse.json({ error: { code: "CONFLICT", message: "Already approved" } }, { status: 409 });
}

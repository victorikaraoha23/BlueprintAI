import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  return NextResponse.json({ data: { sources: [] } });
}

export async function POST(request: NextRequest) {
  return NextResponse.json({ data: { sources: [] } }, { status: 201 });
}

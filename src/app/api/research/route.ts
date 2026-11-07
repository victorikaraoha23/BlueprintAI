import { NextRequest, NextResponse } from "next/server";

export async function GET(_request: NextRequest) {
  return NextResponse.json({ data: { sources: [] } });
}

export async function POST(_request: NextRequest) {
  return NextResponse.json({ data: { sources: [] } }, { status: 201 });
}

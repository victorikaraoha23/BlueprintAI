import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string; versionId: string } },
) {
  // Return time-limited URL
  const downloadUrl = `https://blob.vercel-storage.com/download/${params.versionId}?expires=${Date.now() + 3600000}`;
  return NextResponse.json({ data: { downloadUrl, expiresAt: new Date(Date.now() + 3600000).toISOString() } });
}

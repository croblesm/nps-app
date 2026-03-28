import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const baseUrl = searchParams.get("url") || "http://localhost:11434";

  try {
    const res = await fetch(`${baseUrl}/api/tags`, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) {
      return NextResponse.json({ models: [] });
    }
    const data = await res.json();
    const models = (data.models || []).map((m: { name: string }) => m.name);
    return NextResponse.json({ models });
  } catch {
    return NextResponse.json({ models: [] });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const db = await getDb();
  const { Summary } = await import("@/lib/db/entities/Summary");

  const summary = await db.getRepository(Summary).findOne({
    where: { projectId: id },
    order: { generatedAt: "DESC" },
  });

  if (!summary) {
    return NextResponse.json(null);
  }

  return NextResponse.json({
    id: summary.id,
    markdown: summary.markdownContent,
    generatedAt: summary.generatedAt,
  });
}

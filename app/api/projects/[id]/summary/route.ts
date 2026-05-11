import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { assertProjectAccess } from "@/lib/auth/assert-project-access";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const project = await assertProjectAccess(id);
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }
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
  }, {
    headers: { "Cache-Control": "private, max-age=30" },
  });
}

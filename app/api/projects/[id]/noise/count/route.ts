import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { assertProjectAccess } from "@/lib/auth/assert-project-access";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const project = await assertProjectAccess(id);
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const { searchParams } = new URL(request.url);
  const keywords = searchParams.get("keywords");

  if (!keywords) {
    return NextResponse.json({ count: 0 });
  }

  const keywordList = keywords.split(",").map((k) => k.trim()).filter(Boolean);
  if (keywordList.length === 0) {
    return NextResponse.json({ count: 0 });
  }

  const db = await getDb();
  const { Comment } = await import("@/lib/db/entities/Comment");

  const query = db
    .getRepository(Comment)
    .createQueryBuilder("c")
    .where("c.projectId = :projectId", { projectId: id });

  const conditions = keywordList.map((_, i) => `c.commentText LIKE :kw${i}`);
  const kwParams: Record<string, string> = {};
  keywordList.forEach((kw, i) => {
    kwParams[`kw${i}`] = `%${kw}%`;
  });

  query.andWhere(`(${conditions.join(" OR ")})`, kwParams);

  const count = await query.getCount();
  return NextResponse.json({ count });
}

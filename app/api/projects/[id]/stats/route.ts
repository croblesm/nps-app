import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const db = await getDb();
  const { Comment } = await import("@/lib/db/entities/Comment");

  // NPS stats via aggregation
  const npsStats = await db
    .getRepository(Comment)
    .createQueryBuilder("c")
    .select("COUNT(*)", "total")
    .addSelect("SUM(CASE WHEN c.npsScore >= 9 THEN 1 ELSE 0 END)", "promoters")
    .addSelect("SUM(CASE WHEN c.npsScore >= 7 AND c.npsScore <= 8 THEN 1 ELSE 0 END)", "passives")
    .addSelect("SUM(CASE WHEN c.npsScore <= 6 THEN 1 ELSE 0 END)", "detractors")
    .addSelect("COUNT(CASE WHEN c.npsScore IS NOT NULL THEN 1 END)", "scored")
    .where("c.projectId = :id", { id })
    .getRawOne();

  const total = Number(npsStats.total);
  const promoters = Number(npsStats.promoters);
  const passives = Number(npsStats.passives);
  const detractors = Number(npsStats.detractors);
  const scored = Number(npsStats.scored);
  const npsScore = scored > 0 ? Math.round(((promoters - detractors) / scored) * 100) : 0;

  // Category breakdown via aggregation
  const { Category } = await import("@/lib/db/entities/Category");
  const categoryStats = await db
    .getRepository(Comment)
    .createQueryBuilder("c")
    .leftJoin(Category, "cat", "c.categoryId = cat.id")
    .select("COALESCE(cat.name, 'Uncategorized')", "name")
    .addSelect("COUNT(*)", "count")
    .where("c.projectId = :id", { id })
    .groupBy("cat.name")
    .orderBy("COUNT(*)", "DESC")
    .getRawMany();

  const categoryBreakdown = categoryStats.map((c) => ({
    name: c.name,
    count: Number(c.count),
    percentage: total > 0 ? Math.round((Number(c.count) / total) * 100) : 0,
  }));

  return NextResponse.json({
    total,
    promoters,
    passives,
    detractors,
    scored,
    npsScore,
    promoterPct: scored > 0 ? Math.round((promoters / scored) * 100) : 0,
    passivePct: scored > 0 ? Math.round((passives / scored) * 100) : 0,
    detractorPct: scored > 0 ? Math.round((detractors / scored) * 100) : 0,
    categoryBreakdown,
  });
}

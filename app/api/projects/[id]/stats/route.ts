import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const db = await getDb();
  const { Comment } = await import("@/lib/db/entities/Comment");
  const { NoiseFilter } = await import("@/lib/db/entities/NoiseFilter");

  // Check if any noise filters with excludeFromNps are active
  const noiseFilters = await db.getRepository(NoiseFilter).find({
    where: { projectId: id, isActive: true, excludeFromNps: true },
  });
  const hasNoiseExclusion = noiseFilters.length > 0;

  // NPS stats — exclude noise when filters are active
  const npsQuery = db
    .getRepository(Comment)
    .createQueryBuilder("c")
    .select("COUNT(*)", "total")
    .addSelect("SUM(CASE WHEN c.npsScore >= 9 THEN 1 ELSE 0 END)", "promoters")
    .addSelect("SUM(CASE WHEN c.npsScore >= 7 AND c.npsScore <= 8 THEN 1 ELSE 0 END)", "passives")
    .addSelect("SUM(CASE WHEN c.npsScore <= 6 THEN 1 ELSE 0 END)", "detractors")
    .addSelect("COUNT(CASE WHEN c.npsScore IS NOT NULL THEN 1 END)", "scored")
    .where("c.projectId = :id", { id });

  if (hasNoiseExclusion) {
    npsQuery.andWhere("c.isNoise = :isNoise", { isNoise: false });
  }

  const npsStats = await npsQuery.getRawOne();

  const total = Number(npsStats.total);
  const promoters = Number(npsStats.promoters);
  const passives = Number(npsStats.passives);
  const detractors = Number(npsStats.detractors);
  const scored = Number(npsStats.scored);
  const npsScore = scored > 0 ? Math.round(((promoters - detractors) / scored) * 100) : 0;

  // Noise exclusion count
  let noiseExcludedCount = 0;
  if (hasNoiseExclusion) {
    const noiseCount = await db
      .getRepository(Comment)
      .createQueryBuilder("c")
      .where("c.projectId = :id", { id })
      .andWhere("c.isNoise = :isNoise", { isNoise: true })
      .getCount();
    noiseExcludedCount = noiseCount;
  }

  // Category breakdown — also respect noise exclusion
  const { Category } = await import("@/lib/db/entities/Category");
  const catQuery = db
    .getRepository(Comment)
    .createQueryBuilder("c")
    .leftJoin(Category, "cat", "c.categoryId = cat.id")
    .select("COALESCE(cat.name, 'Uncategorized')", "name")
    .addSelect("COUNT(*)", "count")
    .where("c.projectId = :id", { id });

  if (hasNoiseExclusion) {
    catQuery.andWhere("c.isNoise = :isNoise", { isNoise: false });
  }

  const categoryStats = await catQuery
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
    noiseExcludedCount,
    activeNoiseFilterCount: noiseFilters.length,
  });
}

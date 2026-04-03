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
  const excludeNoiseParam = searchParams.get("excludeNoise");
  const activeFilterIdsParam = searchParams.get("activeFilterIds");

  const db = await getDb();
  const { Comment } = await import("@/lib/db/entities/Comment");
  const { NoiseFilter } = await import("@/lib/db/entities/NoiseFilter");

  // Load all active noise filters for this project
  const allNoiseFilters = await db.getRepository(NoiseFilter).find({
    where: { projectId: id, isActive: true, excludeFromNps: true },
  });

  // Determine which filters to apply based on query params
  let effectiveFilters = allNoiseFilters;
  let noiseExclusionEnabled = allNoiseFilters.length > 0;

  if (excludeNoiseParam === "false") {
    // Client explicitly disabled all noise exclusion
    noiseExclusionEnabled = false;
    effectiveFilters = [];
  } else if (activeFilterIdsParam) {
    // Client specified a custom set of filter IDs
    const activeIds = new Set(activeFilterIdsParam.split(",").filter(Boolean));
    effectiveFilters = allNoiseFilters.filter((f) => activeIds.has(f.id));
    noiseExclusionEnabled = effectiveFilters.length > 0;
  }

  // Auto-repair: if filters exist but no comments are flagged as noise, re-apply
  if (allNoiseFilters.length > 0) {
    const noiseCount = await db.getRepository(Comment)
      .createQueryBuilder("c")
      .where("c.projectId = :id", { id })
      .andWhere("c.isNoise = :isNoise", { isNoise: true })
      .getCount();
    if (noiseCount === 0) {
      for (const filter of allNoiseFilters) {
        const keywords: string[] = JSON.parse(filter.filterKeywords || "[]");
        if (keywords.length === 0) continue;
        const conditions = keywords.map((_, ki) => `commentText LIKE :kw${ki}`);
        const kwParams: Record<string, string> = {};
        keywords.forEach((kw, ki) => { kwParams[`kw${ki}`] = `%${kw}%`; });
        await db.getRepository(Comment)
          .createQueryBuilder()
          .update()
          .set({ isNoise: true })
          .where("projectId = :id", { id })
          .andWhere(`(${conditions.join(" OR ")})`, kwParams)
          .execute();
      }
    }
  }

  // Build noise exclusion WHERE clause
  // When using custom filter set, we need dynamic keyword matching instead of isNoise column
  const useCustomFilters = activeFilterIdsParam !== null && noiseExclusionEnabled;

  // Build a subquery or condition for noise exclusion
  let noiseCondition = "";
  let noiseParams: Record<string, string> = {};

  if (noiseExclusionEnabled && useCustomFilters) {
    // Dynamic: exclude comments matching any of the effective filters' keywords
    const allKeywords: string[] = [];
    for (const filter of effectiveFilters) {
      const kws: string[] = JSON.parse(filter.filterKeywords || "[]");
      allKeywords.push(...kws);
    }
    if (allKeywords.length > 0) {
      const conditions = allKeywords.map((_, ki) => `c.commentText LIKE :nkw${ki}`);
      allKeywords.forEach((kw, ki) => { noiseParams[`nkw${ki}`] = `%${kw}%`; });
      noiseCondition = `NOT (${conditions.join(" OR ")})`;
    }
  }

  // NPS stats
  const npsQuery = db
    .getRepository(Comment)
    .createQueryBuilder("c")
    .select("COUNT(*)", "total")
    .addSelect("SUM(CASE WHEN c.npsScore >= 9 THEN 1 ELSE 0 END)", "promoters")
    .addSelect("SUM(CASE WHEN c.npsScore >= 7 AND c.npsScore <= 8 THEN 1 ELSE 0 END)", "passives")
    .addSelect("SUM(CASE WHEN c.npsScore <= 6 THEN 1 ELSE 0 END)", "detractors")
    .addSelect("COUNT(CASE WHEN c.npsScore IS NOT NULL THEN 1 END)", "scored")
    .where("c.projectId = :id", { id });

  if (noiseExclusionEnabled) {
    if (useCustomFilters && noiseCondition) {
      npsQuery.andWhere(noiseCondition, noiseParams);
    } else if (!useCustomFilters) {
      npsQuery.andWhere("c.isNoise = :isNoise", { isNoise: false });
    }
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
  if (noiseExclusionEnabled) {
    if (useCustomFilters) {
      // Count comments matching the effective filters' keywords
      const allKeywords: string[] = [];
      for (const filter of effectiveFilters) {
        const kws: string[] = JSON.parse(filter.filterKeywords || "[]");
        allKeywords.push(...kws);
      }
      if (allKeywords.length > 0) {
        const matchConds = allKeywords.map((_, ki) => `c.commentText LIKE :mkw${ki}`);
        const matchParams: Record<string, string> = {};
        allKeywords.forEach((kw, ki) => { matchParams[`mkw${ki}`] = `%${kw}%`; });
        noiseExcludedCount = await db.getRepository(Comment)
          .createQueryBuilder("c")
          .where("c.projectId = :id", { id })
          .andWhere(`(${matchConds.join(" OR ")})`, matchParams)
          .getCount();
      }
    } else {
      noiseExcludedCount = await db.getRepository(Comment)
        .createQueryBuilder("c")
        .where("c.projectId = :id", { id })
        .andWhere("c.isNoise = :isNoise", { isNoise: true })
        .getCount();
    }
  }

  // Category breakdown
  const { Category } = await import("@/lib/db/entities/Category");
  const catQuery = db
    .getRepository(Comment)
    .createQueryBuilder("c")
    .leftJoin(Category, "cat", "c.categoryId = cat.id")
    .select("COALESCE(cat.name, 'Uncategorized')", "name")
    .addSelect("COUNT(*)", "count")
    .where("c.projectId = :id", { id });

  if (noiseExclusionEnabled) {
    if (useCustomFilters && noiseCondition) {
      catQuery.andWhere(noiseCondition, noiseParams);
    } else if (!useCustomFilters) {
      catQuery.andWhere("c.isNoise = :isNoise", { isNoise: false });
    }
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
    activeNoiseFilterCount: allNoiseFilters.length,
    activeNoiseFilterNames: allNoiseFilters.map((f) => f.name),
    noiseFilters: allNoiseFilters.map((f) => ({ id: f.id, name: f.name })),
  });
}

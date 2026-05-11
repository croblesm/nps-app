import { unstable_cache } from "next/cache";
import { getDb } from "@/lib/db";

/**
 * Cached NPS stats for a project. TTL: 30s.
 * Invalidate with: revalidateTag(`project-stats-${projectId}`)
 */
export function getCachedProjectStats(projectId: string) {
  return unstable_cache(
    async () => {
      const db = await getDb();
      const { Comment } = await import("@/lib/db/entities/Comment");
      const { NoiseFilter } = await import("@/lib/db/entities/NoiseFilter");

      const noiseFilters = await db.getRepository(NoiseFilter).find({
        where: { projectId, isActive: true, excludeFromNps: true },
      });
      const hasNoiseExclusion = noiseFilters.length > 0;

      const npsQuery = db
        .getRepository(Comment)
        .createQueryBuilder("c")
        .select("COUNT(*)", "total")
        .addSelect("SUM(CASE WHEN c.npsScore >= 9 THEN 1 ELSE 0 END)", "promoters")
        .addSelect("SUM(CASE WHEN c.npsScore >= 7 AND c.npsScore <= 8 THEN 1 ELSE 0 END)", "passives")
        .addSelect("SUM(CASE WHEN c.npsScore <= 6 THEN 1 ELSE 0 END)", "detractors")
        .addSelect("COUNT(CASE WHEN c.npsScore IS NOT NULL THEN 1 END)", "scored")
        .where("c.projectId = :projectId", { projectId });

      if (hasNoiseExclusion) {
        npsQuery.andWhere("c.isNoise = :isNoise", { isNoise: false });
      }

      const raw = await npsQuery.getRawOne();
      const total = Number(raw.total);
      const promoters = Number(raw.promoters);
      const passives = Number(raw.passives);
      const detractors = Number(raw.detractors);
      const scored = Number(raw.scored);
      const npsScore = scored > 0 ? Math.round(((promoters - detractors) / scored) * 100) : 0;

      return {
        total,
        promoters,
        passives,
        detractors,
        scored,
        npsScore,
        promoterPct: scored > 0 ? Math.round((promoters / scored) * 100) : 0,
        passivePct: scored > 0 ? Math.round((passives / scored) * 100) : 0,
        detractorPct: scored > 0 ? Math.round((detractors / scored) * 100) : 0,
      };
    },
    [`project-stats-${projectId}`],
    { revalidate: 30, tags: [`project-stats-${projectId}`] }
  )();
}

/**
 * Cached noise filters for a project. TTL: 60s.
 * Invalidate with: revalidateTag(`noise-filters-${projectId}`)
 */
export function getCachedNoiseFilters(projectId: string) {
  return unstable_cache(
    async () => {
      const db = await getDb();
      const { NoiseFilter } = await import("@/lib/db/entities/NoiseFilter");
      const filters = await db.getRepository(NoiseFilter).find({
        where: { projectId, isActive: true, excludeFromNps: true },
      });
      return filters.map((f) => ({ id: f.id, name: f.name, filterKeywords: f.filterKeywords }));
    },
    [`noise-filters-${projectId}`],
    { revalidate: 60, tags: [`noise-filters-${projectId}`] }
  )();
}

/**
 * Cached summary for a project. TTL: 120s.
 * Invalidate with: revalidateTag(`summary-${projectId}`)
 */
export function getCachedSummary(projectId: string) {
  return unstable_cache(
    async () => {
      const db = await getDb();
      const { Summary } = await import("@/lib/db/entities/Summary");
      const summary = await db.getRepository(Summary).findOne({
        where: { projectId },
        order: { generatedAt: "DESC" },
      });
      if (!summary) return null;
      return {
        id: summary.id,
        markdown: summary.markdownContent || "",
        generatedAt: summary.generatedAt.toISOString(),
      };
    },
    [`summary-${projectId}`],
    { revalidate: 120, tags: [`summary-${projectId}`] }
  )();
}

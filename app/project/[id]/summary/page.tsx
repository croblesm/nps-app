import { getDb } from "@/lib/db";
import { assertProjectAccess } from "@/lib/auth/assert-project-access";
import { SummaryClient } from "./summary-client";

export default async function SummaryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const project = await assertProjectAccess(id);
  if (!project) {
    const { notFound } = await import("next/navigation");
    notFound();
  }

  const db = await getDb();

  // Fetch summary
  const { Summary } = await import("@/lib/db/entities/Summary");
  const summaryEntity = await db.getRepository(Summary).findOne({
    where: { projectId: id },
    order: { generatedAt: "DESC" },
  });
  const initialSummary = summaryEntity
    ? { id: summaryEntity.id, markdown: summaryEntity.markdownContent || "", generatedAt: summaryEntity.generatedAt.toISOString() }
    : null;

  // Fetch NPS stats
  const { Comment } = await import("@/lib/db/entities/Comment");
  const statsRaw = await db
    .getRepository(Comment)
    .createQueryBuilder("c")
    .select("COUNT(*)", "total")
    .addSelect("SUM(CASE WHEN c.npsScore >= 9 THEN 1 ELSE 0 END)", "promoters")
    .addSelect("SUM(CASE WHEN c.npsScore >= 7 AND c.npsScore <= 8 THEN 1 ELSE 0 END)", "passives")
    .addSelect("SUM(CASE WHEN c.npsScore <= 6 THEN 1 ELSE 0 END)", "detractors")
    .addSelect("COUNT(CASE WHEN c.npsScore IS NOT NULL THEN 1 END)", "scored")
    .where("c.projectId = :id", { id })
    .getRawOne();

  const total = Number(statsRaw?.total || 0);
  const promoters = Number(statsRaw?.promoters || 0);
  const passives = Number(statsRaw?.passives || 0);
  const detractors = Number(statsRaw?.detractors || 0);
  const scored = Number(statsRaw?.scored || 0);
  const npsScore = scored > 0 ? Math.round(((promoters - detractors) / scored) * 100) : 0;

  const initialStats = total > 0
    ? {
        total,
        promoters,
        passives,
        detractors,
        npsScore,
        promoterPct: scored > 0 ? Math.round((promoters / scored) * 100) : 0,
        passivePct: scored > 0 ? Math.round((passives / scored) * 100) : 0,
        detractorPct: scored > 0 ? Math.round((detractors / scored) * 100) : 0,
      }
    : null;

  // Fetch quotes
  const promoComments = await db.getRepository(Comment).find({
    where: { projectId: id },
    order: { npsScore: "DESC" },
    take: 10,
  });
  const detractComments = await db.getRepository(Comment).find({
    where: { projectId: id },
    order: { npsScore: "ASC" },
    take: 10,
  });

  const initialPromoterQuotes = promoComments
    .filter((c) => c.commentText && c.npsScore !== null && c.npsScore >= 9)
    .slice(0, 3)
    .map((c) => ({ text: c.commentText!, nps: c.npsScore! }));

  const initialDetractorQuotes = detractComments
    .filter((c) => c.commentText && c.npsScore !== null && c.npsScore <= 6)
    .slice(0, 3)
    .map((c) => ({ text: c.commentText!, nps: c.npsScore! }));

  return (
    <SummaryClient
      initialSummary={initialSummary}
      initialStats={initialStats}
      initialPromoterQuotes={initialPromoterQuotes}
      initialDetractorQuotes={initialDetractorQuotes}
      projectId={id}
    />
  );
}

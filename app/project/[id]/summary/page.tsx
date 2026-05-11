import { getDb } from "@/lib/db";
import { assertProjectAccess } from "@/lib/auth/assert-project-access";
import { getCachedSummary, getCachedProjectStats, getCachedNoiseFilters } from "@/lib/db/cached-queries";
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

  // Use cached queries for performance
  const [initialSummary, stats, noiseFilters] = await Promise.all([
    getCachedSummary(id),
    getCachedProjectStats(id),
    getCachedNoiseFilters(id),
  ]);

  const initialStats = stats.total > 0 ? stats : null;

  // Fetch quotes (exclude noise)
  const db = await getDb();
  const { Comment } = await import("@/lib/db/entities/Comment");
  const [promoComments, detractComments] = await Promise.all([
    db.getRepository(Comment).find({
      where: { projectId: id, isNoise: false },
      order: { npsScore: "DESC" },
      take: 10,
    }),
    db.getRepository(Comment).find({
      where: { projectId: id, isNoise: false },
      order: { npsScore: "ASC" },
      take: 10,
    }),
  ]);

  const initialPromoterQuotes = promoComments
    .filter((c) => c.commentText && c.npsScore !== null && c.npsScore >= 9)
    .slice(0, 3)
    .map((c) => ({ text: c.commentText!, nps: c.npsScore! }));

  const initialDetractorQuotes = detractComments
    .filter((c) => c.commentText && c.npsScore !== null && c.npsScore <= 6)
    .slice(0, 3)
    .map((c) => ({ text: c.commentText!, nps: c.npsScore! }));

  const initialNoiseFilters = noiseFilters.map((f) => ({ id: f.id, name: f.name }));

  return (
    <SummaryClient
      initialSummary={initialSummary}
      initialStats={initialStats}
      initialPromoterQuotes={initialPromoterQuotes}
      initialDetractorQuotes={initialDetractorQuotes}
      initialNoiseFilters={initialNoiseFilters}
      projectId={id}
    />
  );
}

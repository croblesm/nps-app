import { NextResponse } from "next/server";
import { z } from "zod";
import { generateText } from "ai";
import { getDb } from "@/lib/db";
import { getActiveModel } from "@/lib/ai/get-model";
import { parseBody } from "@/lib/api/schemas";
import { buildSummaryPrompt } from "@/lib/ai/prompts";
import { calculateNps } from "@/lib/nps/calculator";
import { assertProjectAccess } from "@/lib/auth/assert-project-access";
import { revalidateTag } from "next/cache";

const summarizeSchema = z.object({
  projectId: z.string().uuid("Invalid project ID"),
  excludeNoise: z.boolean().optional(),
  activeFilterIds: z.array(z.string()).optional(),
});

export async function POST(request: Request) {
  const parsed = await parseBody(request, summarizeSchema);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }
  const { projectId, excludeNoise, activeFilterIds } = parsed.data;

  const project = await assertProjectAccess(projectId);
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const db = await getDb();

  // Get all comments
  const { Comment } = await import("@/lib/db/entities/Comment");
  let comments = await db.getRepository(Comment).find({
    where: { projectId },
    relations: ["category"],
  });

  // Apply noise filtering if requested
  if (excludeNoise && activeFilterIds && activeFilterIds.length > 0) {
    const { NoiseFilter } = await import("@/lib/db/entities/NoiseFilter");
    const filters = await db.getRepository(NoiseFilter).findByIds(activeFilterIds);
    const allKeywords: string[] = [];
    for (const f of filters) {
      const kws: string[] = JSON.parse(f.filterKeywords || "[]");
      allKeywords.push(...kws.map((k) => k.toLowerCase()));
    }
    if (allKeywords.length > 0) {
      comments = comments.filter((c) => {
        if (!c.commentText) return true;
        const lower = c.commentText.toLowerCase();
        return !allKeywords.some((kw) => lower.includes(kw));
      });
    }
  }

  // NPS stats
  const nps = calculateNps(comments.map((c) => c.npsScore));

  // Category breakdown
  const catCounts: Record<string, number> = {};
  comments.forEach((c) => {
    const name = c.category?.name || "Uncategorized";
    catCounts[name] = (catCounts[name] || 0) + 1;
  });
  const categoryBreakdown = Object.entries(catCounts)
    .map(([name, count]) => ({
      name,
      count,
      percentage: Math.round((count / comments.length) * 100),
    }))
    .sort((a, b) => b.count - a.count);

  // Top comments per category (highest confidence, actionable)
  const topComments: { category: string; comment: string; nps: number }[] = [];
  const catGroups = new Map<string, typeof comments>();
  comments.forEach((c) => {
    const name = c.category?.name || "Uncategorized";
    if (!catGroups.has(name)) catGroups.set(name, []);
    catGroups.get(name)!.push(c);
  });
  catGroups.forEach((group, catName) => {
    const best = group
      .filter((c) => c.isActionable && c.commentText)
      .sort((a, b) => (b.aiConfidence || 0) - (a.aiConfidence || 0))
      .slice(0, 2);
    best.forEach((c) => {
      topComments.push({
        category: catName,
        comment: c.commentText!.slice(0, 300),
        nps: c.npsScore || 0,
      });
    });
  });

  // Noise impact
  const { NoiseFilter } = await import("@/lib/db/entities/NoiseFilter");
  const noiseFilters = await db.getRepository(NoiseFilter).find({
    where: { projectId, isActive: true },
  });
  const noiseImpact = noiseFilters.map((nf) => ({
    filterName: nf.name,
    excludedCount: comments.filter((c) => c.isNoise).length,
  }));

  try {
    const model = await getActiveModel();
    const prompt = buildSummaryPrompt({
      projectName: project.name,
      npsScore: nps.npsScore,
      totalResponses: nps.total,
      promoters: nps.promoters,
      passives: nps.passives,
      detractors: nps.detractors,
      categoryBreakdown,
      topComments,
      noiseImpact,
    });

    const { text } = await generateText({ model, prompt });

    // Save summary
    const { Summary } = await import("@/lib/db/entities/Summary");
    const summary = db.getRepository(Summary).create({
      projectId,
      markdownContent: text,
      modelUsed: "active-provider",
    });
    await db.getRepository(Summary).save(summary);

    revalidateTag(`summary-${projectId}`);

    return NextResponse.json({
      id: summary.id,
      markdown: text,
      generatedAt: summary.generatedAt,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Summary failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

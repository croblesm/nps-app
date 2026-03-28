import { NextRequest, NextResponse } from "next/server";
import { generateText } from "ai";
import { getDb } from "@/lib/db";
import { getActiveModel } from "@/lib/ai/get-model";
import { buildSummaryPrompt } from "@/lib/ai/prompts";
import { calculateNps } from "@/lib/nps/calculator";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { projectId } = body;

  if (!projectId) {
    return NextResponse.json({ error: "projectId required" }, { status: 400 });
  }

  const db = await getDb();

  // Get project
  const { Project } = await import("@/lib/db/entities/Project");
  const project = await db.getRepository(Project).findOneBy({ id: projectId });
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  // Get all comments
  const { Comment } = await import("@/lib/db/entities/Comment");
  const comments = await db.getRepository(Comment).find({
    where: { projectId },
    relations: ["category"],
  });

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

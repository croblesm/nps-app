import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { parseBody, createProjectSchema } from "@/lib/api/schemas";
import { getCurrentUserId } from "@/lib/auth/get-user";

export async function GET() {
  const userId = await getCurrentUserId();
  const authRequired = process.env.AUTH_REQUIRED !== "false";

  const db = await getDb();
  const { Project } = await import("@/lib/db/entities/Project");
  const { Comment } = await import("@/lib/db/entities/Comment");

  const where = authRequired && userId ? { userId } : {};
  const projects = await db
    .getRepository(Project)
    .find({ where, order: { createdAt: "DESC" } });

  const stats = await db
    .getRepository(Comment)
    .createQueryBuilder("c")
    .select("c.projectId", "projectId")
    .addSelect("COUNT(*)", "total")
    .addSelect("SUM(CASE WHEN c.npsScore >= 9 THEN 1 ELSE 0 END)", "promoters")
    .addSelect("SUM(CASE WHEN c.npsScore <= 6 THEN 1 ELSE 0 END)", "detractors")
    .addSelect("COUNT(CASE WHEN c.npsScore IS NOT NULL THEN 1 END)", "scored")
    .groupBy("c.projectId")
    .getRawMany();

  const statsMap = new Map(
    stats.map((s) => [
      s.projectId,
      {
        total: Number(s.total),
        promoters: Number(s.promoters),
        detractors: Number(s.detractors),
        scored: Number(s.scored),
      },
    ])
  );

  const summaries = projects.map((p) => {
    const s = statsMap.get(p.id);
    let npsScore: number | null = null;
    let promoterPct: number | null = null;
    let passivePct: number | null = null;
    let detractorPct: number | null = null;
    if (s && s.scored > 0) {
      npsScore = Math.round(((s.promoters - s.detractors) / s.scored) * 100);
      const passives = s.scored - s.promoters - s.detractors;
      promoterPct = Math.round((s.promoters / s.scored) * 100);
      detractorPct = Math.round((s.detractors / s.scored) * 100);
      passivePct = 100 - promoterPct - detractorPct;
      // Avoid negative from rounding
      if (passivePct < 0) passivePct = 0;
    }

    return {
      id: p.id,
      name: p.name,
      description: p.description,
      createdAt: p.createdAt,
      commentCount: s?.total || 0,
      npsScore,
      promoterPct,
      passivePct,
      detractorPct,
    };
  });

  return NextResponse.json(summaries);
}

export async function POST(request: Request) {
  const userId = await getCurrentUserId();

  const parsed = await parseBody(request, createProjectSchema);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const { name, description, analysisHints } = parsed.data;

  const db = await getDb();
  const { Project } = await import("@/lib/db/entities/Project");
  const repo = db.getRepository(Project);

  const project = repo.create({
    name: name.trim(),
    description: description || null,
    analysisHints: analysisHints || null,
    userId: userId || null,
  });

  await repo.save(project);
  return NextResponse.json(project, { status: 201 });
}

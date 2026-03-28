import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET() {
  const db = await getDb();
  const { Project } = await import("@/lib/db/entities/Project");

  const projects = await db
    .getRepository(Project)
    .find({ order: { createdAt: "DESC" } });

  // Single aggregation query instead of N+1
  const { Comment } = await import("@/lib/db/entities/Comment");
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
    if (s && s.scored > 0) {
      npsScore = Math.round(((s.promoters - s.detractors) / s.scored) * 100);
    }

    return {
      id: p.id,
      name: p.name,
      description: p.description,
      createdAt: p.createdAt,
      commentCount: s?.total || 0,
      npsScore,
    };
  });

  return NextResponse.json(summaries);
}

export async function POST(request: NextRequest) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { name, description } = body;

  if (!name?.trim()) {
    return NextResponse.json(
      { error: "Project name is required" },
      { status: 400 }
    );
  }

  if (typeof name !== "string" || name.length > 255) {
    return NextResponse.json(
      { error: "Project name must be a string under 255 characters" },
      { status: 400 }
    );
  }

  const db = await getDb();
  const { Project } = await import("@/lib/db/entities/Project");
  const repo = db.getRepository(Project);

  const project = repo.create({
    name: name.trim(),
    description: typeof description === "string" ? description.slice(0, 2000) : null,
  });

  await repo.save(project);

  return NextResponse.json(project, { status: 201 });
}

import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET() {
  const db = await getDb();
  const { Project } = await import("@/lib/db/entities/Project");
  const { Comment } = await import("@/lib/db/entities/Comment");

  const projects = await db
    .getRepository(Project)
    .find({ order: { createdAt: "DESC" } });

  // Get comment counts and NPS scores for each project
  const summaries = await Promise.all(
    projects.map(async (p) => {
      const commentRepo = db.getRepository(Comment);
      const comments = await commentRepo.find({
        where: { projectId: p.id },
        select: ["npsScore"],
      });

      const commentCount = comments.length;
      let npsScore: number | null = null;

      if (commentCount > 0) {
        const scored = comments.filter((c) => c.npsScore !== null);
        if (scored.length > 0) {
          const promoters = scored.filter((c) => c.npsScore! >= 9).length;
          const detractors = scored.filter((c) => c.npsScore! <= 6).length;
          npsScore = Math.round(
            ((promoters - detractors) / scored.length) * 100
          );
        }
      }

      return {
        id: p.id,
        name: p.name,
        description: p.description,
        createdAt: p.createdAt,
        commentCount,
        npsScore,
      };
    })
  );

  return NextResponse.json(summaries);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { name, description } = body;

  if (!name?.trim()) {
    return NextResponse.json(
      { error: "Project name is required" },
      { status: 400 }
    );
  }

  const db = await getDb();
  const { Project } = await import("@/lib/db/entities/Project");
  const repo = db.getRepository(Project);

  const project = repo.create({
    name: name.trim(),
    description: description || null,
  });

  await repo.save(project);

  return NextResponse.json(project, { status: 201 });
}

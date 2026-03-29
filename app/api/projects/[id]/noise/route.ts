import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { parseBody, createNoiseFilterSchema } from "@/lib/api/schemas";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const db = await getDb();
  const { NoiseFilter } = await import("@/lib/db/entities/NoiseFilter");
  const filters = await db.getRepository(NoiseFilter).find({
    where: { projectId: id },
  });
  return NextResponse.json(filters);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const parsed = await parseBody(request, createNoiseFilterSchema);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }
  const { name, description, filterKeywords, excludeFromNps } = parsed.data;

  const db = await getDb();
  const { NoiseFilter } = await import("@/lib/db/entities/NoiseFilter");
  const repo = db.getRepository(NoiseFilter);

  const filter = repo.create({
    projectId: id,
    name,
    description: description || null,
    filterKeywords: JSON.stringify(filterKeywords),
    excludeFromNps: excludeFromNps ?? false,
    isActive: true,
  });

  await repo.save(filter);

  // Apply noise flag to matching comments
  await applyNoiseFilter(db, id, filterKeywords);

  return NextResponse.json(filter, { status: 201 });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const filterId = searchParams.get("filterId");

  if (!filterId) {
    return NextResponse.json({ error: "filterId required" }, { status: 400 });
  }

  const db = await getDb();
  const { NoiseFilter } = await import("@/lib/db/entities/NoiseFilter");
  await db.getRepository(NoiseFilter).delete({ id: filterId, projectId: id });

  // Recalculate noise flags
  await recalculateNoise(db, id);

  return NextResponse.json({ success: true });
}

async function applyNoiseFilter(
  db: import("typeorm").DataSource,
  projectId: string,
  keywords: string[]
) {
  if (keywords.length === 0) return;

  const { Comment } = await import("@/lib/db/entities/Comment");
  const repo = db.getRepository(Comment);

  // Build a single UPDATE with OR conditions instead of N+1 saves
  const query = repo
    .createQueryBuilder()
    .update()
    .set({ isNoise: true })
    .where("projectId = :projectId", { projectId });

  const conditions = keywords.map((kw, i) => `commentText LIKE :kw${i}`);
  const params: Record<string, string> = {};
  keywords.forEach((kw, i) => {
    params[`kw${i}`] = `%${kw}%`;
  });

  query.andWhere(`(${conditions.join(" OR ")})`, params);
  await query.execute();
}

async function recalculateNoise(
  db: import("typeorm").DataSource,
  projectId: string
) {
  const { Comment } = await import("@/lib/db/entities/Comment");
  const { NoiseFilter } = await import("@/lib/db/entities/NoiseFilter");

  // Reset all noise flags
  await db
    .getRepository(Comment)
    .createQueryBuilder()
    .update()
    .set({ isNoise: false })
    .where("projectId = :projectId", { projectId })
    .execute();

  // Re-apply active filters
  const filters = await db.getRepository(NoiseFilter).find({
    where: { projectId, isActive: true },
  });

  for (const filter of filters) {
    const keywords: string[] = JSON.parse(filter.filterKeywords || "[]");
    await applyNoiseFilter(db, projectId, keywords);
  }
}

import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { searchParams } = new URL(request.url);

  const page = parseInt(searchParams.get("page") || "1");
  const limit = Math.min(parseInt(searchParams.get("limit") || "25"), 100);
  const search = searchParams.get("search") || "";
  const category = searchParams.get("category") || "";
  const feedbackType = searchParams.get("feedbackType") || "";
  const actionable = searchParams.get("actionable") || "";
  const sortBy = searchParams.get("sortBy") || "rowIndex";
  const sortDir = (searchParams.get("sortDir") || "ASC") as "ASC" | "DESC";

  const db = await getDb();
  const { Comment } = await import("@/lib/db/entities/Comment");
  const repo = db.getRepository(Comment);

  let query = repo
    .createQueryBuilder("c")
    .leftJoinAndSelect("c.category", "cat")
    .where("c.projectId = :projectId", { projectId: id });

  // Filters
  if (search) {
    query = query.andWhere("c.commentText LIKE :search", {
      search: `%${search}%`,
    });
  }

  if (category) {
    query = query.andWhere("cat.name = :category", { category });
  }

  if (feedbackType === "promoter") {
    query = query.andWhere("c.npsScore >= 9");
  } else if (feedbackType === "passive") {
    query = query.andWhere("c.npsScore >= 7 AND c.npsScore <= 8");
  } else if (feedbackType === "detractor") {
    query = query.andWhere("c.npsScore <= 6");
  }

  if (actionable === "true") {
    query = query.andWhere("c.isActionable = 1");
  } else if (actionable === "false") {
    query = query.andWhere("c.isActionable = 0");
  }

  // Count
  const total = await query.getCount();

  // Sort and paginate
  const validSortColumns: Record<string, string> = {
    rowIndex: "c.rowIndex",
    npsScore: "c.npsScore",
    category: "cat.name",
    aiConfidence: "c.aiConfidence",
  };
  const sortColumn = validSortColumns[sortBy] || "c.rowIndex";
  query = query
    .orderBy(sortColumn, sortDir)
    .skip((page - 1) * limit)
    .take(limit);

  const comments = await query.getMany();

  return NextResponse.json({
    comments: comments.map((c) => ({
      id: c.id,
      rowIndex: c.rowIndex,
      npsScore: c.npsScore,
      commentText: c.commentText,
      categoryId: c.categoryId,
      categoryName: c.category?.name || null,
      isActionable: c.isActionable,
      isNoise: c.isNoise,
      hasComment: c.hasComment,
      aiConfidence: c.aiConfidence,
      aiReasoning: c.aiReasoning,
      metadata: c.metadata ? JSON.parse(c.metadata) : null,
    })),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  });
}

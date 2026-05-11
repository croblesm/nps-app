import { NextResponse } from "next/server";
import { generateObject } from "ai";
import { getDb } from "@/lib/db";
import { getActiveModel } from "@/lib/ai/get-model";
import { parseBody, projectIdBodySchema } from "@/lib/api/schemas";
import { classificationSchema, buildClassificationPrompt } from "@/lib/ai/prompts";
import { assertProjectAccess } from "@/lib/auth/assert-project-access";
import { revalidateTag } from "next/cache";

const BATCH_SIZE = 25;

export async function POST(request: Request) {
  const parsed = await parseBody(request, projectIdBodySchema);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }
  const { projectId } = parsed.data;

  const project = await assertProjectAccess(projectId);
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const db = await getDb();

  // Get categories
  const { Category } = await import("@/lib/db/entities/Category");
  const categories = await db.getRepository(Category).find({
    where: { projectId, isActive: true },
    order: { sortOrder: "ASC" },
  });

  if (categories.length === 0) {
    return NextResponse.json(
      { error: "No categories found. Complete the category review first." },
      { status: 400 }
    );
  }

  const categoryMap = new Map(categories.map((c) => [c.name, c.id]));
  const fallbackCategory = categories.find((c) => c.isFallback);

  // Get all comments
  const { Comment } = await import("@/lib/db/entities/Comment");
  const commentRepo = db.getRepository(Comment);
  const allComments = await commentRepo.find({
    where: { projectId },
    order: { rowIndex: "ASC" },
  });

  // Pre-process: flag no-comment entries deterministically
  const toClassify: typeof allComments = [];
  for (const comment of allComments) {
    if (!comment.commentText || comment.commentText.trim().length === 0) {
      comment.hasComment = false;
      comment.isActionable = false;
      comment.categoryId = fallbackCategory?.id || null;
      comment.aiConfidence = 1.0;
      comment.aiReasoning = "No comment provided";
      await commentRepo.save(comment);
    } else {
      toClassify.push(comment);
    }
  }

  // Classify in batches
  const model = await getActiveModel();
  const categoryDefs = categories.map((c) => ({
    name: c.name,
    description: c.description || "",
  }));

  let classified = 0;
  const totalToClassify = toClassify.length;
  const errors: string[] = [];

  for (let i = 0; i < toClassify.length; i += BATCH_SIZE) {
    const batch = toClassify.slice(i, i + BATCH_SIZE);
    const commentInputs = batch.map((c) => ({
      index: c.rowIndex,
      text: c.commentText!,
    }));

    try {
      const prompt = buildClassificationPrompt(categoryDefs, commentInputs);
      const { object } = await generateObject({
        model,
        schema: classificationSchema,
        prompt,
      });

      // Apply classifications — batch save instead of one-by-one
      const toSave = [];
      for (const result of object.classifications) {
        const comment = batch.find((c) => c.rowIndex === result.index);
        if (!comment) continue;

        comment.categoryId =
          categoryMap.get(result.category) || fallbackCategory?.id || null;
        comment.aiConfidence = result.confidence;
        comment.aiReasoning = result.reasoning;
        comment.isActionable = result.isActionable;
        toSave.push(comment);
        classified++;
      }
      if (toSave.length > 0) {
        await commentRepo.save(toSave);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Batch failed";
      errors.push(`Batch ${Math.floor(i / BATCH_SIZE) + 1}: ${msg}`);
    }
  }

  revalidateTag(`project-stats-${projectId}`);

  return NextResponse.json({
    totalComments: allComments.length,
    noComment: allComments.length - totalToClassify,
    classified,
    totalToClassify,
    errors,
  });
}

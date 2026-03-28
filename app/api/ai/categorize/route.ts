import { NextResponse } from "next/server";
import { generateObject } from "ai";
import { getDb } from "@/lib/db";
import { getActiveModel } from "@/lib/ai/get-model";
import { parseBody, projectIdBodySchema } from "@/lib/api/schemas";
import {
  themeDiscoverySchema,
  buildThemeDiscoveryPrompt,
} from "@/lib/ai/prompts";
import { stratifiedSample } from "@/lib/csv/sampler";

export async function POST(request: Request) {
  const parsed = await parseBody(request, projectIdBodySchema);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }
  const { projectId } = parsed.data;

  const db = await getDb();

  // Get project info
  const { Project } = await import("@/lib/db/entities/Project");
  const project = await db.getRepository(Project).findOneBy({ id: projectId });
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  // Get all comments with text
  const { Comment } = await import("@/lib/db/entities/Comment");
  const allComments = await db.getRepository(Comment).find({
    where: { projectId },
    order: { rowIndex: "ASC" },
  });

  const commentsWithText = allComments
    .filter((c) => c.commentText && c.commentText.trim().length > 0)
    .map((c) => ({
      index: c.rowIndex,
      text: c.commentText!,
      nps: c.npsScore,
    }));

  if (commentsWithText.length === 0) {
    return NextResponse.json(
      { error: "No comments with text found in the data" },
      { status: 400 }
    );
  }

  // Stratified sample
  const sample = stratifiedSample(commentsWithText, 75);

  try {
    const model = await getActiveModel();

    const prompt = buildThemeDiscoveryPrompt(
      project.name,
      project.description,
      sample
    );

    const { object } = await generateObject({
      model,
      schema: themeDiscoverySchema,
      prompt,
    });

    // Map sample indices back to actual comments for display
    const categoriesWithSamples = object.categories.map((cat) => ({
      ...cat,
      sampleComments: cat.sampleIndices
        .map((idx) => {
          const comment = sample.find((s) => s.index === idx);
          return comment ? { index: idx, text: comment.text, nps: comment.nps } : null;
        })
        .filter(Boolean),
    }));

    return NextResponse.json({
      categories: categoriesWithSamples,
      sampleSize: sample.length,
      totalComments: commentsWithText.length,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "AI categorization failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

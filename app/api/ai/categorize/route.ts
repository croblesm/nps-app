import { NextResponse } from "next/server";
import { generateObject } from "ai";
import { getDb } from "@/lib/db";
import { getActiveModel } from "@/lib/ai/get-model";
import { parseBody, categorizeActionSchema } from "@/lib/api/schemas";
import {
  themeDiscoverySchema,
  buildThemeDiscoveryPrompt,
  suggestMoreSchema,
  buildSuggestMorePrompt,
  themeScanSchema,
  buildThemeScanPrompt,
} from "@/lib/ai/prompts";
import { stratifiedSample } from "@/lib/csv/sampler";
import { assertProjectAccess } from "@/lib/auth/assert-project-access";

export async function POST(request: Request) {
  const parsed = await parseBody(request, categorizeActionSchema);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }
  const { projectId, action, existingCategories, themeName, themeDescription } =
    parsed.data;

  const project = await assertProjectAccess(projectId);
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const db = await getDb();

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

  const sample = stratifiedSample(commentsWithText, 75);

  try {
    const model = await getActiveModel();

    if (action === "suggest-more") {
      const prompt = buildSuggestMorePrompt(
        project.name,
        existingCategories || [],
        sample,
        project.analysisHints
      );

      const { object } = await generateObject({
        model,
        schema: suggestMoreSchema,
        prompt,
      });

      const categoriesWithSamples = object.categories.map((cat) => ({
        ...cat,
        sampleComments: cat.sampleIndices
          .map((idx) => {
            const comment = sample.find((s) => s.index === idx);
            return comment
              ? { index: idx, text: comment.text, nps: comment.nps }
              : null;
          })
          .filter(Boolean),
      }));

      return NextResponse.json({ categories: categoriesWithSamples });
    }

    if (action === "scan-for-theme") {
      if (!themeName) {
        return NextResponse.json(
          { error: "themeName is required for scan-for-theme" },
          { status: 400 }
        );
      }

      const prompt = buildThemeScanPrompt(
        themeName,
        themeDescription || themeName,
        sample
      );

      const { object } = await generateObject({
        model,
        schema: themeScanSchema,
        prompt,
      });

      const sampleComments = object.sampleIndices
        .map((idx) => {
          const comment = sample.find((s) => s.index === idx);
          return comment
            ? { index: idx, text: comment.text, nps: comment.nps }
            : null;
        })
        .filter(Boolean);

      return NextResponse.json({
        ...object,
        sampleComments,
      });
    }

    // Default: discover
    const prompt = buildThemeDiscoveryPrompt(
      project.name,
      project.description,
      sample,
      project.analysisHints
    );

    const { object } = await generateObject({
      model,
      schema: themeDiscoverySchema,
      prompt,
    });

    const categoriesWithSamples = object.categories.map((cat) => ({
      ...cat,
      sampleComments: cat.sampleIndices
        .map((idx) => {
          const comment = sample.find((s) => s.index === idx);
          return comment
            ? { index: idx, text: comment.text, nps: comment.nps }
            : null;
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

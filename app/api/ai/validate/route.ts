import { NextResponse } from "next/server";
import { generateObject } from "ai";
import { getDb } from "@/lib/db";
import { getActiveModel } from "@/lib/ai/get-model";
import { parseBody, projectIdBodySchema } from "@/lib/api/schemas";
import { assertProjectAccess } from "@/lib/auth/assert-project-access";
import {
  dataValidatorSchema,
  buildDataValidatorPrompt,
} from "@/lib/ai/prompts";

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
  const { DataSource } = await import("@/lib/db/entities/DataSource");
  const dataSource = await db
    .getRepository(DataSource)
    .findOneBy({ projectId });

  if (!dataSource) {
    return NextResponse.json(
      { error: "No data uploaded for this project" },
      { status: 400 }
    );
  }

  const columns = JSON.parse(dataSource.columns || "[]");

  const { Comment } = await import("@/lib/db/entities/Comment");
  const sampleComments = await db.getRepository(Comment).find({
    where: { projectId },
    order: { rowIndex: "ASC" },
    take: 20,
  });

  const sampleRows = sampleComments.map((c) =>
    JSON.parse(c.rawData || "{}")
  );

  try {
    const model = await getActiveModel();

    const prompt = buildDataValidatorPrompt(
      columns,
      sampleRows,
      dataSource.rowCount || 0
    );

    const { object } = await generateObject({
      model,
      schema: dataValidatorSchema,
      prompt,
    });

    return NextResponse.json(object);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "AI validation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

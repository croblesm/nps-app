import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { embedBatch } from "@/lib/ai/embeddings";
import { decrypt } from "@/lib/ai/encryption";
import { parseBody, projectIdBodySchema } from "@/lib/api/schemas";

const BATCH_SIZE = 10;

export async function POST(request: Request) {
  const parsed = await parseBody(request, projectIdBodySchema);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }
  const { projectId } = parsed.data;

  const db = await getDb();

  // Get project
  const { Project } = await import("@/lib/db/entities/Project");
  const project = await db.getRepository(Project).findOneBy({ id: projectId });
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  // Get LLM config for embedding provider
  const { LlmConfig } = await import("@/lib/db/entities/LlmConfig");
  const config = await db
    .getRepository(LlmConfig)
    .findOneBy({ isDefault: true });

  if (!config) {
    return NextResponse.json(
      { error: "No LLM provider configured. Go to Settings to set one up." },
      { status: 400 }
    );
  }

  const apiKey = config.apiKeyEncrypted
    ? decrypt(config.apiKeyEncrypted)
    : undefined;

  // Determine embedding model based on provider
  const provider = config.provider;
  let embeddingModel = "text-embedding-3-small";
  if (provider === "ollama") {
    embeddingModel = "nomic-embed-text";
  }

  // Get comments with text that need embeddings
  const { Comment } = await import("@/lib/db/entities/Comment");
  const commentRepo = db.getRepository(Comment);
  const comments = await commentRepo.find({
    where: { projectId },
    order: { rowIndex: "ASC" },
  });

  const toEmbed = comments.filter(
    (c) => c.commentText && c.commentText.trim().length > 0 && !c.embedding
  );

  if (toEmbed.length === 0) {
    // Mark chat as enabled if all comments already embedded
    project.chatEnabled = true;
    await db.getRepository(Project).save(project);
    return NextResponse.json({
      total: comments.length,
      embedded: 0,
      alreadyEmbedded: comments.filter((c) => c.embedding).length,
      status: "complete",
    });
  }

  let embedded = 0;
  const errors: string[] = [];

  // Process in batches
  for (let i = 0; i < toEmbed.length; i += BATCH_SIZE) {
    const batch = toEmbed.slice(i, i + BATCH_SIZE);
    const texts = batch.map((c) => c.commentText!);

    try {
      const embeddings = await embedBatch(
        texts,
        provider,
        apiKey,
        config.endpointUrl || undefined,
        embeddingModel
      );

      // Save embeddings as JSON strings
      for (let j = 0; j < batch.length; j++) {
        batch[j].embedding = JSON.stringify(embeddings[j]);
        await commentRepo.save(batch[j]);
        embedded++;
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Embedding batch failed";
      errors.push(`Batch ${Math.floor(i / BATCH_SIZE) + 1}: ${msg}`);
    }
  }

  // Update project embedding metadata
  project.embeddingProvider = provider;
  project.embeddingModel = embeddingModel;
  project.embeddingDimensions = 1536;
  project.chatEnabled = errors.length === 0;
  await db.getRepository(Project).save(project);

  return NextResponse.json({
    total: comments.length,
    embedded,
    totalToEmbed: toEmbed.length,
    errors,
    status: errors.length === 0 ? "complete" : "partial",
  });
}

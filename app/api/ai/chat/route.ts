import { NextResponse } from "next/server";
import { z } from "zod";
import { generateText } from "ai";
import { getDb } from "@/lib/db";
import { getActiveModel } from "@/lib/ai/get-model";
import { embedText } from "@/lib/ai/embeddings";
import {
  getEmbeddingConfig,
  getEmbeddingConfigForProvider,
} from "@/lib/ai/get-embedding-config";
import { parseBody } from "@/lib/api/schemas";

const DEFAULT_K = 20;

const chatSchema = z.object({
  projectId: z.string().uuid("Invalid project ID"),
  message: z.string().min(1, "Message is required").max(2000),
  topK: z.number().int().min(1).max(50).optional(),
  filters: z.object({
    feedbackType: z.string().optional(),
    category: z.string().optional(),
    search: z.string().optional(),
    actionable: z.string().optional(),
  }).optional(),
});

export async function POST(request: Request) {
  const parsed = await parseBody(request, chatSchema);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }
  const { projectId, message, filters, topK } = parsed.data;
  const K = topK || DEFAULT_K;

  const db = await getDb();

  // Verify project exists and chat is enabled
  const { Project } = await import("@/lib/db/entities/Project");
  const project = await db.getRepository(Project).findOneBy({ id: projectId });
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }
  if (!project.chatEnabled) {
    return NextResponse.json(
      { error: "Chat analysis is not enabled. Run the embedding pipeline first." },
      { status: 400 }
    );
  }

  // Resolve embedding provider — must match the one used to create embeddings
  const embeddingConfig = project.embeddingProvider
    ? await getEmbeddingConfigForProvider(project.embeddingProvider)
    : await getEmbeddingConfig();

  if (!embeddingConfig) {
    const msg = project.embeddingProvider
      ? `The embedding provider (${project.embeddingProvider}) used for this project is no longer configured. Re-add it in Settings.`
      : "No embedding-capable provider configured. Add OpenAI, Azure OpenAI, or Ollama in Settings.";
    return NextResponse.json(
      { error: msg, code: "NO_EMBEDDING_PROVIDER" },
      { status: 400 }
    );
  }

  // Embed the user's question using the same provider/model as the stored embeddings
  const queryEmbedding = await embedText(
    message,
    embeddingConfig.provider,
    embeddingConfig.apiKey,
    embeddingConfig.endpointUrl,
    project.embeddingModel || embeddingConfig.embeddingModel
  );

  // Use raw SQL for VECTOR_DISTANCE similarity search
  // Since TypeORM stores embedding as nvarchar(MAX) JSON, we parse and compare
  // For SQL Server 2025 with native VECTOR type, use VECTOR_DISTANCE
  // Fallback: retrieve comments with embeddings and compute cosine similarity in JS
  const { Comment } = await import("@/lib/db/entities/Comment");
  const commentRepo = db.getRepository(Comment);
  const allComments = await commentRepo.find({
    where: { projectId },
    relations: ["category"],
    order: { rowIndex: "ASC" },
  });

  // Apply dashboard filters before similarity search
  let filtered = allComments.filter((c) => c.embedding);
  if (filters?.feedbackType) {
    const NPS_THRESHOLDS = { PROMOTER_MIN: 9, PASSIVE_MIN: 7 };
    if (filters.feedbackType === "promoter") filtered = filtered.filter((c) => c.npsScore !== null && c.npsScore >= NPS_THRESHOLDS.PROMOTER_MIN);
    else if (filters.feedbackType === "passive") filtered = filtered.filter((c) => c.npsScore !== null && c.npsScore >= NPS_THRESHOLDS.PASSIVE_MIN && c.npsScore < NPS_THRESHOLDS.PROMOTER_MIN);
    else if (filters.feedbackType === "detractor") filtered = filtered.filter((c) => c.npsScore !== null && c.npsScore < NPS_THRESHOLDS.PASSIVE_MIN);
  }
  if (filters?.category) {
    filtered = filtered.filter((c) => {
      const catName = c.category && typeof c.category === "object" && "name" in c.category ? (c.category as { name: string }).name : null;
      return catName === filters.category;
    });
  }
  if (filters?.search) {
    const searchLower = filters.search.toLowerCase();
    filtered = filtered.filter((c) => c.commentText?.toLowerCase().includes(searchLower));
  }
  if (filters?.actionable === "true") {
    filtered = filtered.filter((c) => c.isActionable);
  } else if (filters?.actionable === "false") {
    filtered = filtered.filter((c) => !c.isActionable);
  }

  // Compute cosine similarity on filtered set
  const scored = filtered
    .map((c) => {
      const emb = JSON.parse(c.embedding!) as number[];
      const similarity = cosineSimilarity(queryEmbedding, emb);
      return { comment: c, similarity };
    })
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, K);

  // Check if results are relevant (similarity threshold)
  const SIMILARITY_THRESHOLD = 0.3;
  const relevant = scored.filter((s) => s.similarity >= SIMILARITY_THRESHOLD);

  if (relevant.length === 0) {
    // No relevant comments — return guidance instead of hallucinated answer
    const { Category } = await import("@/lib/db/entities/Category");
    const categories = await db.getRepository(Category).find({ where: { projectId } });
    const catNames = categories.map((c) => c.name).slice(0, 5).join(", ");

    const noResultMsg = `I couldn't find any comments closely related to your question. Try asking about specific themes like: ${catNames || "performance, features, or usability"}.`;

    const { ChatMessage } = await import("@/lib/db/entities/ChatMessage");
    const chatRepo = db.getRepository(ChatMessage);
    await chatRepo.save(chatRepo.create({ projectId, role: "user", content: message, citations: null }));
    await chatRepo.save(chatRepo.create({ projectId, role: "assistant", content: noResultMsg, citations: null }));

    return NextResponse.json({ response: noResultMsg, citations: [], messageId: null });
  }

  // Build context for LLM
  const contextLines = relevant.map((s, i) => {
    const c = s.comment;
    const catName =
      c.category && typeof c.category === "object" && "name" in c.category
        ? (c.category as { name: string }).name
        : "Uncategorized";
    return `[${i + 1}] (Score: ${c.npsScore ?? "N/A"}, Category: ${catName}, Similarity: ${s.similarity.toFixed(3)})\n"${c.commentText}"`;
  });

  const systemPrompt = `You are an NPS analysis assistant. Answer questions about customer feedback based on the retrieved comments below. Always cite specific comments using [N] notation. Be concise and data-driven.

Project: ${project.name}
${project.description ? `Description: ${project.description}` : ""}

Retrieved comments (ordered by relevance):
${contextLines.join("\n\n")}`;

  // Generate LLM response
  const model = await getActiveModel();
  const { text: responseText } = await generateText({
    model,
    system: systemPrompt,
    prompt: message,
  });

  // Extract cited comment IDs
  const citedIds = relevant
    .filter((_, i) => responseText.includes(`[${i + 1}]`))
    .map((s) => s.comment.id);

  // Save messages to chat history
  const { ChatMessage } = await import("@/lib/db/entities/ChatMessage");
  const chatRepo = db.getRepository(ChatMessage);

  const userMsg = chatRepo.create({
    projectId,
    role: "user",
    content: message,
    citations: null,
  });
  await chatRepo.save(userMsg);

  const assistantMsg = chatRepo.create({
    projectId,
    role: "assistant",
    content: responseText,
    citations: citedIds.length > 0 ? JSON.stringify(citedIds) : null,
  });
  await chatRepo.save(assistantMsg);

  // Build cited comments response
  const citedComments = relevant
    .filter((_, i) => responseText.includes(`[${i + 1}]`))
    .map((s, i) => ({
      index: i + 1,
      id: s.comment.id,
      text: s.comment.commentText,
      npsScore: s.comment.npsScore,
      category:
        s.comment.category &&
        typeof s.comment.category === "object" &&
        "name" in s.comment.category
          ? (s.comment.category as { name: string }).name
          : null,
      similarity: s.similarity,
    }));

  return NextResponse.json({
    response: responseText,
    citations: citedComments,
    messageId: assistantMsg.id,
  });
}

/**
 * Compute cosine similarity between two vectors.
 */
function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  return denominator === 0 ? 0 : dotProduct / denominator;
}

import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { embedBatch } from "@/lib/ai/embeddings";
import { getEmbeddingConfig } from "@/lib/ai/get-embedding-config";
import { parseBody, projectIdBodySchema } from "@/lib/api/schemas";
import { assertProjectAccess } from "@/lib/auth/assert-project-access";

const BATCH_SIZE = 10;

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

  // Find an embedding-capable provider
  const embeddingConfig = await getEmbeddingConfig();
  if (!embeddingConfig) {
    return NextResponse.json(
      {
        error:
          "No embedding-capable provider configured. Add OpenAI, Azure OpenAI, or Ollama (with nomic-embed-text) in Settings to enable Chat Analysis.",
        code: "NO_EMBEDDING_PROVIDER",
      },
      { status: 400 }
    );
  }

  const { provider, apiKey, endpointUrl, embeddingModel } = embeddingConfig;

  // Stream progress updates via SSE
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      function send(event: string, data: Record<string, unknown>) {
        controller.enqueue(
          encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
        );
      }

      try {
        // Step 1: Ollama model check
        if (provider === "ollama") {
          send("progress", { step: "Checking Ollama embedding model..." });
          const ollamaBase =
            endpointUrl?.replace(/\/v1\/?$/, "") || "http://localhost:11434";
          try {
            const tagsRes = await fetch(`${ollamaBase}/api/tags`);
            if (tagsRes.ok) {
              const tags = await tagsRes.json();
              const models = (tags.models || []).map(
                (m: { name: string }) => m.name
              );
              const hasModel = models.some(
                (m: string) =>
                  m === embeddingModel || m.startsWith(`${embeddingModel}:`)
              );
              if (!hasModel) {
                send("progress", {
                  step: `Pulling embedding model "${embeddingModel}"... this may take a moment`,
                });
                try {
                  const pullRes = await fetch(`${ollamaBase}/api/pull`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ name: embeddingModel }),
                  });
                  if (!pullRes.ok) {
                    send("error", {
                      error: `Embedding model "${embeddingModel}" is not installed. Run: ollama pull ${embeddingModel}`,
                      code: "MISSING_EMBEDDING_MODEL",
                    });
                    controller.close();
                    return;
                  }
                  // Consume the pull stream to wait for completion
                  await pullRes.text();
                  send("progress", {
                    step: `Model "${embeddingModel}" ready`,
                  });
                } catch {
                  send("error", {
                    error: `Failed to pull "${embeddingModel}". Run: ollama pull ${embeddingModel}`,
                    code: "MISSING_EMBEDDING_MODEL",
                  });
                  controller.close();
                  return;
                }
              }
            }
          } catch {
            // Ollama may not be running — let it fail later
          }
        }

        // Step 2: Load comments
        send("progress", { step: "Loading comments..." });
        const { Project } = await import("@/lib/db/entities/Project");
        const { Comment } = await import("@/lib/db/entities/Comment");
        const commentRepo = db.getRepository(Comment);
        const comments = await commentRepo.find({
          where: { projectId },
          order: { rowIndex: "ASC" },
        });

        const toEmbed = comments.filter(
          (c) =>
            c.commentText && c.commentText.trim().length > 0 && !c.embedding
        );

        if (toEmbed.length === 0) {
          project.chatEnabled = true;
          await db.getRepository(Project).save(project);
          send("complete", {
            total: comments.length,
            embedded: 0,
            alreadyEmbedded: comments.filter((c) => c.embedding).length,
            status: "complete",
          });
          controller.close();
          return;
        }

        send("progress", {
          step: `Embedding ${toEmbed.length} comments using ${provider} / ${embeddingModel}...`,
          total: toEmbed.length,
          embedded: 0,
        });

        // Step 3: Process batches
        let embedded = 0;
        const errors: string[] = [];

        for (let i = 0; i < toEmbed.length; i += BATCH_SIZE) {
          const batch = toEmbed.slice(i, i + BATCH_SIZE);
          const texts = batch.map((c) => c.commentText!);

          try {
            const embeddings = await embedBatch(
              texts,
              provider,
              apiKey,
              endpointUrl,
              embeddingModel
            );

            for (let j = 0; j < batch.length; j++) {
              batch[j].embedding = JSON.stringify(embeddings[j]);
              await commentRepo.save(batch[j]);
              embedded++;
            }
          } catch (err) {
            const msg =
              err instanceof Error ? err.message : "Embedding batch failed";
            errors.push(
              `Batch ${Math.floor(i / BATCH_SIZE) + 1}: ${msg}`
            );
          }

          send("progress", {
            step: `Embedding comments... ${embedded}/${toEmbed.length}`,
            total: toEmbed.length,
            embedded,
          });
        }

        // Step 4: Save metadata
        project.embeddingProvider = provider;
        project.embeddingModel = embeddingModel;
        project.embeddingDimensions = 1536;
        project.chatEnabled = errors.length === 0;
        await db.getRepository(Project).save(project);

        send("complete", {
          total: comments.length,
          embedded,
          totalToEmbed: toEmbed.length,
          errors,
          status: errors.length === 0 ? "complete" : "partial",
        });
      } catch (err) {
        send("error", {
          error:
            err instanceof Error ? err.message : "Embedding pipeline failed",
        });
      }

      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}

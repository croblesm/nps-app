import { createOpenAI } from "@ai-sdk/openai";

/**
 * Embed a single text string using the configured embedding provider.
 */
export async function embedText(
  text: string,
  provider: string,
  apiKey?: string,
  endpointUrl?: string,
  model?: string
): Promise<number[]> {
  const openai = createOpenAI({
    apiKey: apiKey || "ollama",
    baseURL:
      provider === "ollama"
        ? endpointUrl || "http://localhost:11434/v1"
        : endpointUrl || undefined,
  });

  const embeddingModel = openai.textEmbeddingModel(
    model || "text-embedding-3-small"
  );

  const result = await embeddingModel.doEmbed({
    values: [text],
  });

  return result.embeddings[0];
}

/**
 * Embed a batch of texts, processing in chunks of 10 to avoid rate limits.
 */
export async function embedBatch(
  texts: string[],
  provider: string,
  apiKey?: string,
  endpointUrl?: string,
  model?: string
): Promise<number[][]> {
  const results: number[][] = [];
  const BATCH_SIZE = 10;

  for (let i = 0; i < texts.length; i += BATCH_SIZE) {
    const batch = texts.slice(i, i + BATCH_SIZE);
    const openai = createOpenAI({
      apiKey: apiKey || "ollama",
      baseURL:
        provider === "ollama"
          ? endpointUrl || "http://localhost:11434/v1"
          : endpointUrl || undefined,
    });

    const embeddingModel = openai.textEmbeddingModel(
      model || "text-embedding-3-small"
    );

    const { embeddings } = await embeddingModel.doEmbed({
      values: batch,
    });

    results.push(...embeddings);
  }

  return results;
}

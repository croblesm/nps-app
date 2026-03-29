import { getDb } from "@/lib/db";
import { decrypt } from "@/lib/ai/encryption";
import {
  EMBEDDING_CAPABLE_PROVIDERS,
  EMBEDDING_MODELS,
  type LlmProvider,
} from "@/lib/ai/models";

export interface EmbeddingConfig {
  provider: LlmProvider;
  apiKey: string | undefined;
  endpointUrl: string | undefined;
  embeddingModel: string;
}

/**
 * Find an embedding-capable LLM config.
 * 1. If the default provider supports embeddings, use it.
 * 2. Otherwise, search all configs for one that does.
 * 3. Returns null if no embedding-capable provider is configured.
 */
export async function getEmbeddingConfig(): Promise<EmbeddingConfig | null> {
  const db = await getDb();
  const { LlmConfig } = await import("@/lib/db/entities/LlmConfig");
  const repo = db.getRepository(LlmConfig);

  // Try default first
  const defaultConfig = await repo.findOneBy({ isDefault: true });
  if (
    defaultConfig &&
    EMBEDDING_CAPABLE_PROVIDERS.includes(defaultConfig.provider as LlmProvider)
  ) {
    return toEmbeddingConfig(defaultConfig);
  }

  // Search all configs for an embedding-capable one
  const allConfigs = await repo.find();
  const capable = allConfigs.find((c) =>
    EMBEDDING_CAPABLE_PROVIDERS.includes(c.provider as LlmProvider)
  );

  if (capable) {
    return toEmbeddingConfig(capable);
  }

  return null;
}

/**
 * Find the embedding config that matches a specific provider.
 * Used when a project already has embeddings and we need the same provider.
 */
export async function getEmbeddingConfigForProvider(
  provider: string
): Promise<EmbeddingConfig | null> {
  const db = await getDb();
  const { LlmConfig } = await import("@/lib/db/entities/LlmConfig");
  const config = await db.getRepository(LlmConfig).findOneBy({ provider });

  if (!config) return null;
  return toEmbeddingConfig(config);
}

function toEmbeddingConfig(config: {
  provider: string;
  apiKeyEncrypted: string | null;
  endpointUrl: string | null;
}): EmbeddingConfig {
  const provider = config.provider as LlmProvider;
  return {
    provider,
    apiKey: config.apiKeyEncrypted ? decrypt(config.apiKeyEncrypted) : undefined,
    endpointUrl: config.endpointUrl || undefined,
    embeddingModel: EMBEDDING_MODELS[provider] || "text-embedding-3-small",
  };
}

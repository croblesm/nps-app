import { getDb } from "@/lib/db";
import { createModel } from "./providers";
import { decrypt } from "./encryption";

export async function getActiveModel() {
  const db = await getDb();
  const { LlmConfig } = await import("@/lib/db/entities/LlmConfig");
  const config = await db
    .getRepository(LlmConfig)
    .findOneBy({ isDefault: true });

  if (!config) {
    throw new Error(
      "No LLM provider configured. Go to Settings to set one up."
    );
  }

  if (!config.modelName) {
    throw new Error("No model selected in LLM configuration.");
  }

  const apiKey = config.apiKeyEncrypted
    ? decrypt(config.apiKeyEncrypted)
    : undefined;

  return createModel({
    provider: config.provider as
      | "anthropic"
      | "openai"
      | "azure-openai"
      | "ollama",
    apiKey,
    endpointUrl: config.endpointUrl || undefined,
    modelName: config.modelName,
  });
}

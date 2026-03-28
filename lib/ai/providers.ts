import { createAnthropic } from "@ai-sdk/anthropic";
import { createOpenAI } from "@ai-sdk/openai";
import type { LanguageModel } from "ai";
import type { LlmProvider } from "./models";

export interface LlmProviderConfig {
  provider: LlmProvider;
  apiKey?: string;
  endpointUrl?: string;
  modelName: string;
}

/**
 * Creates a language model instance based on the provider configuration.
 * Server-only — uses Vercel AI SDK provider packages.
 */
export function createModel(config: LlmProviderConfig): LanguageModel {
  switch (config.provider) {
    case "anthropic": {
      const anthropic = createAnthropic({ apiKey: config.apiKey });
      return anthropic(config.modelName);
    }

    case "openai": {
      const openai = createOpenAI({ apiKey: config.apiKey });
      return openai(config.modelName);
    }

    case "azure-openai": {
      const azure = createOpenAI({
        apiKey: config.apiKey,
        baseURL: config.endpointUrl,
      });
      return azure(config.modelName);
    }

    case "ollama": {
      const ollama = createOpenAI({
        baseURL: config.endpointUrl || "http://localhost:11434/v1",
        apiKey: "ollama",
      });
      return ollama(config.modelName);
    }

    default:
      throw new Error(`Unsupported LLM provider: ${config.provider}`);
  }
}

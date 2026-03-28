import { createAnthropic } from "@ai-sdk/anthropic";
import { createOpenAI } from "@ai-sdk/openai";
import type { LanguageModel } from "ai";

export type LlmProvider = "anthropic" | "openai" | "azure-openai" | "ollama";

export interface LlmProviderConfig {
  provider: LlmProvider;
  apiKey?: string;
  endpointUrl?: string;
  modelName: string;
}

/**
 * Creates a language model instance based on the provider configuration.
 * Uses Vercel AI SDK's provider abstraction for a unified interface.
 */
export function createModel(config: LlmProviderConfig): LanguageModel {
  switch (config.provider) {
    case "anthropic": {
      const anthropic = createAnthropic({
        apiKey: config.apiKey,
      });
      return anthropic(config.modelName);
    }

    case "openai": {
      const openai = createOpenAI({
        apiKey: config.apiKey,
      });
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
      // Ollama exposes an OpenAI-compatible API
      const ollama = createOpenAI({
        baseURL: config.endpointUrl || "http://localhost:11434/v1",
        apiKey: "ollama", // Ollama doesn't require a real key
      });
      return ollama(config.modelName);
    }

    default:
      throw new Error(`Unsupported LLM provider: ${config.provider}`);
  }
}

/** Available models per provider (for the settings UI dropdown) */
export const PROVIDER_MODELS: Record<LlmProvider, string[]> = {
  anthropic: [
    "claude-sonnet-4-6",
    "claude-haiku-4-5-20251001",
    "claude-opus-4-6",
  ],
  openai: ["gpt-4o", "gpt-4o-mini", "gpt-4.1", "gpt-4.1-mini"],
  "azure-openai": [], // User must provide deployment name
  ollama: [], // User must provide model name
};

/** Default model per provider */
export const DEFAULT_MODELS: Record<LlmProvider, string> = {
  anthropic: "claude-sonnet-4-6",
  openai: "gpt-4o",
  "azure-openai": "",
  ollama: "",
};

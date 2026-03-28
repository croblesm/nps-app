/** Provider types and model lists — safe to import from client components */

export type LlmProvider = "anthropic" | "openai" | "azure-openai" | "ollama";

export const PROVIDERS: { value: LlmProvider; label: string }[] = [
  { value: "anthropic", label: "Anthropic" },
  { value: "openai", label: "OpenAI" },
  { value: "azure-openai", label: "Azure OpenAI" },
  { value: "ollama", label: "Ollama (Local)" },
];

export const PROVIDER_MODELS: Record<LlmProvider, string[]> = {
  anthropic: [
    "claude-sonnet-4-6",
    "claude-haiku-4-5-20251001",
    "claude-opus-4-6",
  ],
  openai: ["gpt-4o", "gpt-4o-mini", "gpt-4.1", "gpt-4.1-mini"],
  "azure-openai": [],
  ollama: [],
};

export const DEFAULT_MODELS: Record<LlmProvider, string> = {
  anthropic: "claude-sonnet-4-6",
  openai: "gpt-4o",
  "azure-openai": "",
  ollama: "",
};

import { describe, it, expect } from "vitest";
import { z } from "zod";
import {
  EMBEDDING_CAPABLE_PROVIDERS,
  EMBEDDING_MODELS,
  type LlmProvider,
} from "@/lib/ai/models";

/**
 * Tests for embedding-related logic.
 * Since embedText/embedBatch require external API calls (OpenAI, Ollama),
 * we test the cosine similarity function and schema validation used by the chat route.
 */

// Cosine similarity — extracted from app/api/ai/chat/route.ts
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

describe("cosineSimilarity", () => {
  it("returns 1 for identical vectors", () => {
    const v = [1, 2, 3, 4, 5];
    expect(cosineSimilarity(v, v)).toBeCloseTo(1.0);
  });

  it("returns 0 for orthogonal vectors", () => {
    expect(cosineSimilarity([1, 0], [0, 1])).toBeCloseTo(0.0);
  });

  it("returns -1 for opposite vectors", () => {
    expect(cosineSimilarity([1, 0], [-1, 0])).toBeCloseTo(-1.0);
  });

  it("returns 0 for mismatched lengths", () => {
    expect(cosineSimilarity([1, 2], [1, 2, 3])).toBe(0);
  });

  it("returns 0 for zero vectors", () => {
    expect(cosineSimilarity([0, 0, 0], [1, 2, 3])).toBe(0);
  });

  it("handles high-dimensional vectors", () => {
    const a = Array.from({ length: 1536 }, (_, i) => Math.sin(i));
    const b = Array.from({ length: 1536 }, (_, i) => Math.cos(i));
    const sim = cosineSimilarity(a, b);
    expect(sim).toBeGreaterThan(-1);
    expect(sim).toBeLessThan(1);
  });

  it("is symmetric", () => {
    const a = [0.5, 0.3, 0.8, 0.1];
    const b = [0.2, 0.9, 0.4, 0.7];
    expect(cosineSimilarity(a, b)).toBeCloseTo(cosineSimilarity(b, a));
  });
});

describe("chat schema validation", () => {
  const chatSchema = z.object({
    projectId: z.string().uuid("Invalid project ID"),
    message: z.string().min(1, "Message is required").max(2000),
  });

  it("accepts valid chat message", () => {
    const result = chatSchema.safeParse({
      projectId: "550e8400-e29b-41d4-a716-446655440000",
      message: "What are the top complaints?",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid project ID", () => {
    const result = chatSchema.safeParse({
      projectId: "not-a-uuid",
      message: "test",
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty message", () => {
    const result = chatSchema.safeParse({
      projectId: "550e8400-e29b-41d4-a716-446655440000",
      message: "",
    });
    expect(result.success).toBe(false);
  });

  it("rejects message over 2000 chars", () => {
    const result = chatSchema.safeParse({
      projectId: "550e8400-e29b-41d4-a716-446655440000",
      message: "x".repeat(2001),
    });
    expect(result.success).toBe(false);
  });
});

describe("EMBEDDING_CAPABLE_PROVIDERS", () => {
  it("includes openai, azure-openai, ollama", () => {
    expect(EMBEDDING_CAPABLE_PROVIDERS).toContain("openai");
    expect(EMBEDDING_CAPABLE_PROVIDERS).toContain("azure-openai");
    expect(EMBEDDING_CAPABLE_PROVIDERS).toContain("ollama");
  });

  it("excludes anthropic", () => {
    expect(EMBEDDING_CAPABLE_PROVIDERS).not.toContain("anthropic");
  });

  it("has a model mapping for each capable provider", () => {
    for (const provider of EMBEDDING_CAPABLE_PROVIDERS) {
      expect(EMBEDDING_MODELS[provider as LlmProvider]).toBeDefined();
      expect(EMBEDDING_MODELS[provider as LlmProvider]!.length).toBeGreaterThan(0);
    }
  });

  it("uses correct default models", () => {
    expect(EMBEDDING_MODELS.openai).toBe("text-embedding-3-small");
    expect(EMBEDDING_MODELS["azure-openai"]).toBe("text-embedding-3-small");
    expect(EMBEDDING_MODELS.ollama).toBe("nomic-embed-text");
  });
});

describe("embedding JSON serialization", () => {
  it("roundtrips embedding vectors through JSON", () => {
    const original = [0.123456, -0.789012, 0.345678, 0.0, -1.0, 1.0];
    const serialized = JSON.stringify(original);
    const parsed = JSON.parse(serialized) as number[];
    expect(parsed).toEqual(original);
  });

  it("handles 1536-dimensional vectors", () => {
    const vector = Array.from({ length: 1536 }, () => Math.random() * 2 - 1);
    const serialized = JSON.stringify(vector);
    const parsed = JSON.parse(serialized) as number[];
    expect(parsed.length).toBe(1536);
    expect(parsed[0]).toBeCloseTo(vector[0]);
    expect(parsed[1535]).toBeCloseTo(vector[1535]);
  });
});

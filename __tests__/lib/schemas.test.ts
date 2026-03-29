import { describe, it, expect } from "vitest";
import {
  createProjectSchema,
  saveLlmConfigSchema,
  createNoiseFilterSchema,
  saveCategoriesSchema,
  saveStructureSchema,
  projectIdBodySchema,
  categorizeActionSchema,
} from "@/lib/api/schemas";

describe("createProjectSchema", () => {
  it("accepts valid input", () => {
    const result = createProjectSchema.safeParse({ name: "My Project" });
    expect(result.success).toBe(true);
  });

  it("accepts name with description", () => {
    const result = createProjectSchema.safeParse({
      name: "My Project",
      description: "A description",
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty name", () => {
    const result = createProjectSchema.safeParse({ name: "" });
    expect(result.success).toBe(false);
  });

  it("rejects missing name", () => {
    const result = createProjectSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it("rejects name over 255 chars", () => {
    const result = createProjectSchema.safeParse({ name: "x".repeat(256) });
    expect(result.success).toBe(false);
  });
});

describe("saveLlmConfigSchema", () => {
  it("accepts valid anthropic config", () => {
    const result = saveLlmConfigSchema.safeParse({
      provider: "anthropic",
      apiKey: "sk-test",
      modelName: "claude-sonnet-4-6",
    });
    expect(result.success).toBe(true);
  });

  it("accepts ollama without API key", () => {
    const result = saveLlmConfigSchema.safeParse({
      provider: "ollama",
      modelName: "llama3.1:8b",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid provider", () => {
    const result = saveLlmConfigSchema.safeParse({
      provider: "invalid",
      modelName: "test",
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing model name", () => {
    const result = saveLlmConfigSchema.safeParse({
      provider: "openai",
      modelName: "",
    });
    expect(result.success).toBe(false);
  });
});

describe("createNoiseFilterSchema", () => {
  it("accepts valid filter", () => {
    const result = createNoiseFilterSchema.safeParse({
      name: "ADS/SSMS",
      filterKeywords: ["ADS", "SSMS"],
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty keywords array", () => {
    const result = createNoiseFilterSchema.safeParse({
      name: "Test",
      filterKeywords: [],
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing name", () => {
    const result = createNoiseFilterSchema.safeParse({
      filterKeywords: ["test"],
    });
    expect(result.success).toBe(false);
  });
});

describe("saveCategoriesSchema", () => {
  it("accepts valid categories", () => {
    const result = saveCategoriesSchema.safeParse({
      categories: [{ name: "Performance" }, { name: "General Feedback" }],
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty categories array", () => {
    const result = saveCategoriesSchema.safeParse({ categories: [] });
    expect(result.success).toBe(false);
  });
});

describe("saveStructureSchema", () => {
  it("accepts valid structure", () => {
    const result = saveStructureSchema.safeParse({
      includedColumns: ["NPS", "Comments"],
      excludedColumns: ["Timestamp"],
    });
    expect(result.success).toBe(true);
  });
});

describe("createProjectSchema with analysisHints", () => {
  it("accepts project with analysis hints", () => {
    const result = createProjectSchema.safeParse({
      name: "My Project",
      analysisHints: "Focus on competitor comparisons with SSMS",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.analysisHints).toBe("Focus on competitor comparisons with SSMS");
    }
  });

  it("accepts project without analysis hints", () => {
    const result = createProjectSchema.safeParse({ name: "My Project" });
    expect(result.success).toBe(true);
  });

  it("rejects analysis hints over 2000 chars", () => {
    const result = createProjectSchema.safeParse({
      name: "Test",
      analysisHints: "x".repeat(2001),
    });
    expect(result.success).toBe(false);
  });
});

describe("categorizeActionSchema", () => {
  it("accepts discover action", () => {
    const result = categorizeActionSchema.safeParse({
      projectId: "550e8400-e29b-41d4-a716-446655440000",
      action: "discover",
    });
    expect(result.success).toBe(true);
  });

  it("defaults to discover when action is omitted", () => {
    const result = categorizeActionSchema.safeParse({
      projectId: "550e8400-e29b-41d4-a716-446655440000",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.action).toBe("discover");
    }
  });

  it("accepts suggest-more with existing categories", () => {
    const result = categorizeActionSchema.safeParse({
      projectId: "550e8400-e29b-41d4-a716-446655440000",
      action: "suggest-more",
      existingCategories: ["Performance", "UI/UX"],
    });
    expect(result.success).toBe(true);
  });

  it("accepts scan-for-theme with name and description", () => {
    const result = categorizeActionSchema.safeParse({
      projectId: "550e8400-e29b-41d4-a716-446655440000",
      action: "scan-for-theme",
      themeName: "Competitor Comparisons",
      themeDescription: "Comments comparing to SSMS or Azure Data Studio",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid action", () => {
    const result = categorizeActionSchema.safeParse({
      projectId: "550e8400-e29b-41d4-a716-446655440000",
      action: "invalid-action",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid projectId", () => {
    const result = categorizeActionSchema.safeParse({
      projectId: "not-a-uuid",
      action: "discover",
    });
    expect(result.success).toBe(false);
  });
});

describe("projectIdBodySchema", () => {
  it("accepts valid UUID", () => {
    const result = projectIdBodySchema.safeParse({
      projectId: "550e8400-e29b-41d4-a716-446655440000",
    });
    expect(result.success).toBe(true);
  });

  it("rejects non-UUID string", () => {
    const result = projectIdBodySchema.safeParse({
      projectId: "not-a-uuid",
    });
    expect(result.success).toBe(false);
  });
});

import { describe, it, expect } from "vitest";
import { buildAssistantSystemPrompt } from "@/lib/ai/assistant-prompts";

describe("buildAssistantSystemPrompt", () => {
  it("includes page-specific guidance for upload page", () => {
    const prompt = buildAssistantSystemPrompt("upload", {});
    expect(prompt).toContain("upload page");
    expect(prompt).toContain("CSV format");
  });

  it("includes page-specific guidance for dashboard page", () => {
    const prompt = buildAssistantSystemPrompt("dashboard", {});
    expect(prompt).toContain("dashboard page");
    expect(prompt).toContain("NPS scores");
  });

  it("includes page-specific guidance for categories page", () => {
    const prompt = buildAssistantSystemPrompt("categories", {});
    expect(prompt).toContain("categories page");
  });

  it("includes page-specific guidance for noise page", () => {
    const prompt = buildAssistantSystemPrompt("noise", {});
    expect(prompt).toContain("noise filters page");
  });

  it("includes page-specific guidance for summary page", () => {
    const prompt = buildAssistantSystemPrompt("summary", {});
    expect(prompt).toContain("summary page");
  });

  it("includes page-specific guidance for github page", () => {
    const prompt = buildAssistantSystemPrompt("github", {});
    expect(prompt).toContain("GitHub integration");
  });

  it("falls back gracefully for unknown pages", () => {
    const prompt = buildAssistantSystemPrompt("unknown-page", {});
    expect(prompt).toContain("unknown-page page");
  });

  it("injects project metadata", () => {
    const prompt = buildAssistantSystemPrompt("dashboard", {
      projectName: "MSSQL Extension",
      projectDescription: "NPS analysis for VS Code",
    });
    expect(prompt).toContain("MSSQL Extension");
    expect(prompt).toContain("NPS analysis for VS Code");
  });

  it("injects upload context", () => {
    const prompt = buildAssistantSystemPrompt("upload", {
      uploadStatus: "uploaded",
      fileName: "survey.csv",
    });
    expect(prompt).toContain("Upload status: uploaded");
    expect(prompt).toContain("Uploaded file: survey.csv");
  });

  it("injects structure context with columns", () => {
    const prompt = buildAssistantSystemPrompt("structure", {
      columns: [
        { name: "NPS", included: true },
        { name: "Comment", included: true },
        { name: "Timestamp", included: false },
      ],
    });
    expect(prompt).toContain("Included columns: NPS, Comment");
    expect(prompt).toContain("Excluded columns: Timestamp");
  });

  it("injects categories context", () => {
    const prompt = buildAssistantSystemPrompt("categories", {
      categories: [
        { name: "Performance", count: 42 },
        { name: "UI/UX", count: 31 },
      ],
    });
    expect(prompt).toContain("Discovered categories (2)");
    expect(prompt).toContain("Performance: 42 comments");
    expect(prompt).toContain("UI/UX: 31 comments");
  });

  it("injects dashboard context with NPS stats", () => {
    const prompt = buildAssistantSystemPrompt("dashboard", {
      npsScore: -15,
      totalResponses: 384,
      promoterPct: 20,
      passivePct: 45,
      detractorPct: 35,
    });
    expect(prompt).toContain("NPS Score: -15");
    expect(prompt).toContain("Total responses: 384");
    expect(prompt).toContain("20% promoters");
  });

  it("injects category breakdown on dashboard", () => {
    const prompt = buildAssistantSystemPrompt("dashboard", {
      categoryBreakdown: [
        { name: "Performance", count: 50, percentage: 25 },
        { name: "General Feedback", count: 100, percentage: 50 },
      ],
    });
    expect(prompt).toContain("Category breakdown:");
    expect(prompt).toContain("Performance: 50 (25%)");
  });

  it("injects noise filter context", () => {
    const prompt = buildAssistantSystemPrompt("noise", {
      noiseFilters: [
        { name: "ADS/SSMS", keywords: ["ADS", "SSMS"] },
      ],
      excludedCount: 52,
    });
    expect(prompt).toContain("Active noise filters (1)");
    expect(prompt).toContain("ADS/SSMS: ADS, SSMS");
    expect(prompt).toContain("excluded by noise filters: 52");
  });

  it("injects summary generated status", () => {
    const prompt = buildAssistantSystemPrompt("summary", {
      summaryGenerated: true,
    });
    expect(prompt).toContain("Summary report has been generated");
  });

  it("shows not generated when summary is false", () => {
    const prompt = buildAssistantSystemPrompt("summary", {
      summaryGenerated: false,
    });
    expect(prompt).toContain("not been generated yet");
  });

  // Proactive recommendations
  it("recommends noise filters for common patterns", () => {
    const prompt = buildAssistantSystemPrompt("noise", {
      noiseFilters: [],
    });
    expect(prompt).toContain("Consider adding noise filters");
    expect(prompt).toContain('"n/a"');
  });

  it("skips noise recommendation when patterns already filtered", () => {
    const prompt = buildAssistantSystemPrompt("noise", {
      noiseFilters: [
        { name: "Common", keywords: ["n/a", "na", "test", "asdf", "xxx", "none", "no comment"] },
      ],
    });
    expect(prompt).not.toContain("Consider adding noise filters");
  });

  it("recommends investigating high-impact categories", () => {
    const prompt = buildAssistantSystemPrompt("dashboard", {
      categoryBreakdown: [
        { name: "Performance Issues", count: 80, percentage: 25 },
        { name: "General Feedback", count: 160, percentage: 50 },
      ],
    });
    expect(prompt).toContain("High-impact categories");
    expect(prompt).toContain("Performance Issues");
    // General Feedback should be excluded from recommendation
    expect(prompt).not.toContain('"General Feedback" (50%)');
  });

  it("recommends action for negative NPS", () => {
    const prompt = buildAssistantSystemPrompt("dashboard", {
      npsScore: -15,
    });
    expect(prompt).toContain("below zero");
    expect(prompt).toContain("detractor feedback");
  });

  it("does not recommend action for positive NPS", () => {
    const prompt = buildAssistantSystemPrompt("dashboard", {
      npsScore: 45,
    });
    expect(prompt).not.toContain("below zero");
  });
});

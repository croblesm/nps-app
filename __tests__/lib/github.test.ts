import { describe, it, expect } from "vitest";
import { githubConfigSchema, createGithubIssueSchema } from "@/lib/api/schemas";
import { buildIssueTitle, buildIssueBody } from "@/lib/github/issue-template";

describe("githubConfigSchema", () => {
  it("accepts valid config", () => {
    const result = githubConfigSchema.safeParse({
      repoOwner: "microsoft",
      repoName: "vscode-mssql",
      pat: "ghp_xxxxxxxxxxxxxxxxxxxx",
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty repo owner", () => {
    const result = githubConfigSchema.safeParse({
      repoOwner: "",
      repoName: "vscode-mssql",
      pat: "ghp_test",
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty repo name", () => {
    const result = githubConfigSchema.safeParse({
      repoOwner: "microsoft",
      repoName: "",
      pat: "ghp_test",
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty pat", () => {
    const result = githubConfigSchema.safeParse({
      repoOwner: "microsoft",
      repoName: "vscode-mssql",
      pat: "",
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing fields", () => {
    const result = githubConfigSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});

describe("createGithubIssueSchema", () => {
  const validIssue = {
    categoryName: "Performance Issues",
    commentCount: 42,
    npsImpact: "NPS Score: -15 (20% promoters, 35% detractors)",
    topComments: [
      { text: "The extension is very slow", nps: 3 },
      { text: "Loading takes forever", nps: 2 },
    ],
    recommendation: "Investigate query execution performance",
  };

  it("accepts valid issue data", () => {
    const result = createGithubIssueSchema.safeParse(validIssue);
    expect(result.success).toBe(true);
  });

  it("accepts with optional categoryId", () => {
    const result = createGithubIssueSchema.safeParse({
      ...validIssue,
      categoryId: "550e8400-e29b-41d4-a716-446655440000",
    });
    expect(result.success).toBe(true);
  });

  it("accepts null categoryId", () => {
    const result = createGithubIssueSchema.safeParse({
      ...validIssue,
      categoryId: null,
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty category name", () => {
    const result = createGithubIssueSchema.safeParse({
      ...validIssue,
      categoryName: "",
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty topComments", () => {
    const result = createGithubIssueSchema.safeParse({
      ...validIssue,
      topComments: [],
    });
    expect(result.success).toBe(false);
  });

  it("rejects NPS score > 10", () => {
    const result = createGithubIssueSchema.safeParse({
      ...validIssue,
      topComments: [{ text: "test", nps: 11 }],
    });
    expect(result.success).toBe(false);
  });

  it("rejects NPS score < 0", () => {
    const result = createGithubIssueSchema.safeParse({
      ...validIssue,
      topComments: [{ text: "test", nps: -1 }],
    });
    expect(result.success).toBe(false);
  });

  it("rejects negative comment count", () => {
    const result = createGithubIssueSchema.safeParse({
      ...validIssue,
      commentCount: -1,
    });
    expect(result.success).toBe(false);
  });
});

describe("buildIssueTitle", () => {
  it("formats title with category name", () => {
    const title = buildIssueTitle("Performance Issues");
    expect(title).toBe("[NPS Feedback] Performance Issues");
  });

  it("handles special characters", () => {
    const title = buildIssueTitle("UI/UX Complaints");
    expect(title).toContain("UI/UX Complaints");
  });
});

describe("buildIssueBody", () => {
  const params = {
    categoryName: "Performance Issues",
    commentCount: 42,
    npsImpact: "NPS Score: -15",
    topComments: [
      { text: "The extension is very slow", nps: 3 },
      { text: "Loading takes forever", nps: 2 },
    ],
    recommendation: "Investigate query execution performance",
  };

  it("includes category name in heading", () => {
    const body = buildIssueBody(params);
    expect(body).toContain("## NPS Feedback: Performance Issues");
  });

  it("includes comment count", () => {
    const body = buildIssueBody(params);
    expect(body).toContain("**42 comments**");
  });

  it("includes NPS impact", () => {
    const body = buildIssueBody(params);
    expect(body).toContain("NPS Score: -15");
  });

  it("includes quoted comments with NPS scores", () => {
    const body = buildIssueBody(params);
    expect(body).toContain("> **NPS 3:** The extension is very slow");
    expect(body).toContain("> **NPS 2:** Loading takes forever");
  });

  it("includes recommendation", () => {
    const body = buildIssueBody(params);
    expect(body).toContain("Investigate query execution performance");
  });

  it("includes project attribution", () => {
    const body = buildIssueBody(params);
    expect(body).toContain("NPS Insight Engine");
  });
});

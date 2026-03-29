import { describe, it, expect } from "vitest";
import {
  buildThemeDiscoveryPrompt,
  buildSuggestMorePrompt,
  buildThemeScanPrompt,
} from "@/lib/ai/prompts";

const sampleComments = [
  { index: 0, text: "SSMS is much better", nps: 3 },
  { index: 1, text: "Great extension!", nps: 10 },
  { index: 2, text: "Too slow when editing data", nps: 5 },
];

describe("buildThemeDiscoveryPrompt", () => {
  it("includes product name", () => {
    const prompt = buildThemeDiscoveryPrompt("My Product", null, sampleComments);
    expect(prompt).toContain("My Product");
  });

  it("includes product description when provided", () => {
    const prompt = buildThemeDiscoveryPrompt("My Product", "A VS Code extension", sampleComments);
    expect(prompt).toContain("A VS Code extension");
  });

  it("includes sample comments", () => {
    const prompt = buildThemeDiscoveryPrompt("My Product", null, sampleComments);
    expect(prompt).toContain("SSMS is much better");
    expect(prompt).toContain("Great extension!");
  });

  it("includes analysis hints when provided", () => {
    const prompt = buildThemeDiscoveryPrompt(
      "My Product",
      null,
      sampleComments,
      "Focus on competitor comparisons with SSMS"
    );
    expect(prompt).toContain("Analysis Focus");
    expect(prompt).toContain("competitor comparisons with SSMS");
  });

  it("omits analysis hints section when null", () => {
    const prompt = buildThemeDiscoveryPrompt("My Product", null, sampleComments, null);
    expect(prompt).not.toContain("Analysis Focus");
  });
});

describe("buildSuggestMorePrompt", () => {
  it("includes existing categories", () => {
    const prompt = buildSuggestMorePrompt(
      "My Product",
      ["Performance", "UI/UX"],
      sampleComments
    );
    expect(prompt).toContain("Performance");
    expect(prompt).toContain("UI/UX");
  });

  it("includes analysis hints when provided", () => {
    const prompt = buildSuggestMorePrompt(
      "My Product",
      ["Performance"],
      sampleComments,
      "Focus on SSMS comparisons"
    );
    expect(prompt).toContain("SSMS comparisons");
  });

  it("asks for additional categories only", () => {
    const prompt = buildSuggestMorePrompt("My Product", ["Performance"], sampleComments);
    expect(prompt).toContain("ADDITIONAL");
    expect(prompt).toContain("Do NOT repeat existing");
  });
});

describe("buildThemeScanPrompt", () => {
  it("includes theme name and description", () => {
    const prompt = buildThemeScanPrompt(
      "Competitor Comparisons",
      "Comments comparing to SSMS or Azure Data Studio",
      sampleComments
    );
    expect(prompt).toContain("Competitor Comparisons");
    expect(prompt).toContain("SSMS or Azure Data Studio");
  });

  it("includes comments to scan", () => {
    const prompt = buildThemeScanPrompt("Test Theme", "Test desc", sampleComments);
    expect(prompt).toContain("SSMS is much better");
    expect(prompt).toContain("[0]");
  });

  it("asks for minimum 3 matches", () => {
    const prompt = buildThemeScanPrompt("Test", "Test", sampleComments);
    expect(prompt).toContain("at least 3");
  });
});

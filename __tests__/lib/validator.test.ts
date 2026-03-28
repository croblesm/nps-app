import { describe, it, expect } from "vitest";
import { analyzeColumns, validateStructure } from "@/lib/csv/validator";

describe("analyzeColumns", () => {
  it("returns empty for empty input", () => {
    expect(analyzeColumns([])).toEqual([]);
  });

  it("detects numeric columns", () => {
    const rows = [
      { Score: 10, Name: "Alice" },
      { Score: 8, Name: "Bob" },
      { Score: 5, Name: "Charlie" },
    ];
    const cols = analyzeColumns(rows);
    const scoreCol = cols.find((c) => c.name === "Score");
    expect(scoreCol?.type).toBe("numeric");
  });

  it("detects text columns", () => {
    const rows = [
      { Score: 10, Comment: "Great product" },
      { Score: 8, Comment: "Could be better" },
    ];
    const cols = analyzeColumns(rows);
    const commentCol = cols.find((c) => c.name === "Comment");
    expect(commentCol?.type).toBe("text");
  });

  it("calculates null percentages", () => {
    const rows = [
      { Value: 1 },
      { Value: null },
      { Value: 3 },
      { Value: null },
    ];
    const cols = analyzeColumns(rows);
    expect(cols[0].nullCount).toBe(2);
    expect(cols[0].nullPercentage).toBe(50);
  });

  it("provides sample values", () => {
    const rows = [
      { Name: "Alice" },
      { Name: "Bob" },
      { Name: "Charlie" },
    ];
    const cols = analyzeColumns(rows);
    expect(cols[0].sampleValues).toContain("Alice");
    expect(cols[0].sampleValues.length).toBeLessThanOrEqual(5);
  });
});

describe("validateStructure", () => {
  it("passes when both numeric and text columns exist", () => {
    const columns = [
      { name: "NPS", type: "numeric" as const, nullCount: 0, nullPercentage: 0, sampleValues: ["10"] },
      { name: "Comment", type: "text" as const, nullCount: 0, nullPercentage: 0, sampleValues: ["Good"] },
    ];
    const result = validateStructure(columns);
    expect(result.valid).toBe(true);
    expect(result.issues).toHaveLength(0);
  });

  it("fails when no numeric column", () => {
    const columns = [
      { name: "Comment", type: "text" as const, nullCount: 0, nullPercentage: 0, sampleValues: ["Good"] },
    ];
    const result = validateStructure(columns);
    expect(result.valid).toBe(false);
    expect(result.issues.some((i) => i.includes("numeric"))).toBe(true);
  });

  it("fails when no text column", () => {
    const columns = [
      { name: "NPS", type: "numeric" as const, nullCount: 0, nullPercentage: 0, sampleValues: ["10"] },
    ];
    const result = validateStructure(columns);
    expect(result.valid).toBe(false);
    expect(result.issues.some((i) => i.includes("text"))).toBe(true);
  });

  it("fails for empty columns", () => {
    const result = validateStructure([]);
    expect(result.valid).toBe(false);
  });

  it("warns about high null percentages", () => {
    const columns = [
      { name: "NPS", type: "numeric" as const, nullCount: 0, nullPercentage: 0, sampleValues: ["10"] },
      { name: "Comment", type: "text" as const, nullCount: 60, nullPercentage: 60, sampleValues: ["Good"] },
    ];
    const result = validateStructure(columns);
    expect(result.valid).toBe(true);
    expect(result.issues.some((i) => i.includes("60%"))).toBe(true);
  });
});

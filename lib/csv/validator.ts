import { z } from "zod";

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export interface ColumnInfo {
  name: string;
  type: "numeric" | "text" | "date" | "boolean" | "unknown";
  nullCount: number;
  nullPercentage: number;
  sampleValues: string[];
}

/**
 * Analyzes parsed CSV data to detect column types and statistics.
 */
export function analyzeColumns(
  rows: Record<string, unknown>[]
): ColumnInfo[] {
  if (rows.length === 0) return [];

  const headers = Object.keys(rows[0]);

  return headers.map((name) => {
    const values = rows.map((r) => r[name]);
    const nonNull = values.filter(
      (v) => v !== null && v !== undefined && String(v).trim() !== ""
    );
    const nullCount = values.length - nonNull.length;

    // Detect type from non-null values
    let type: ColumnInfo["type"] = "unknown";
    if (nonNull.length > 0) {
      const sample = nonNull.slice(0, 50);
      const numericCount = sample.filter((v) => !isNaN(Number(v))).length;
      const dateCount = sample.filter(
        (v) => !isNaN(Date.parse(String(v)))
      ).length;
      const boolCount = sample.filter((v) =>
        ["true", "false", "0", "1"].includes(String(v).toLowerCase())
      ).length;

      if (numericCount / sample.length > 0.8) type = "numeric";
      else if (boolCount / sample.length > 0.8) type = "boolean";
      else if (dateCount / sample.length > 0.8 && numericCount / sample.length < 0.5)
        type = "date";
      else type = "text";
    }

    // Get unique sample values
    const sampleValues = [
      ...new Set(nonNull.slice(0, 5).map((v) => String(v))),
    ];

    return {
      name,
      type,
      nullCount,
      nullPercentage: Math.round((nullCount / values.length) * 100),
      sampleValues,
    };
  });
}

/**
 * Validates that the CSV has minimum required structure:
 * at least one numeric column (for NPS scores) and one text column (for comments).
 */
export function validateStructure(columns: ColumnInfo[]): {
  valid: boolean;
  issues: string[];
} {
  const issues: string[] = [];

  if (columns.length === 0) {
    issues.push("CSV has no columns");
    return { valid: false, issues };
  }

  const hasNumeric = columns.some((c) => c.type === "numeric");
  const hasText = columns.some((c) => c.type === "text");

  if (!hasNumeric) {
    issues.push(
      "No numeric column found. NPS scores require at least one numeric column."
    );
  }
  if (!hasText) {
    issues.push(
      "No text column found. Comment analysis requires at least one text column."
    );
  }

  // Warn about high null percentages
  columns.forEach((c) => {
    if (c.nullPercentage > 50) {
      issues.push(
        `Column "${c.name}" has ${c.nullPercentage}% null values`
      );
    }
  });

  return { valid: hasNumeric && hasText, issues };
}

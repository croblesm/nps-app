import { z } from "zod";

// ── Agent 1: Data Validator ──────────────────────────────────────────

export const dataValidatorSchema = z.object({
  npsColumn: z
    .string()
    .describe("The column name that contains NPS scores (0-10 numeric scale)"),
  commentColumn: z
    .string()
    .describe("The column name that contains free-text user comments"),
  issues: z
    .array(z.string())
    .describe("Data quality issues found (e.g., inconsistent formats, suspicious values)"),
  columnRecommendations: z.array(
    z.object({
      column: z.string().describe("Column name"),
      include: z.boolean().describe("Whether to include this column in the analysis"),
      reason: z.string().describe("Brief explanation of the recommendation"),
    })
  ),
});

export type DataValidatorOutput = z.infer<typeof dataValidatorSchema>;

export function buildDataValidatorPrompt(
  columns: { name: string; type: string; sampleValues: string[] }[],
  sampleRows: Record<string, unknown>[],
  rowCount: number
): string {
  const columnSummary = columns
    .map(
      (c) =>
        `- "${c.name}" (${c.type}): sample values: ${c.sampleValues.join(", ")}`
    )
    .join("\n");

  const sampleData = sampleRows
    .slice(0, 20)
    .map((r) => JSON.stringify(r))
    .join("\n");

  return `You are analyzing a CSV file containing NPS (Net Promoter Score) survey data.
The file has ${rowCount} rows and ${columns.length} columns.

## Column Summary
${columnSummary}

## Sample Rows (first 20)
${sampleData}

## Your Task
1. Identify which column contains the NPS score (a 0-10 numeric rating)
2. Identify which column contains free-text user comments/feedback
3. Flag any data quality issues you notice
4. For EACH column, recommend whether to include it in the analysis report and explain why

Guidelines:
- NPS scores should be integers from 0 to 10
- The comment column typically has the longest text values
- Columns like timestamps, internal IDs, or technical metadata are usually not useful for the report
- Columns like version numbers, user segments, or product areas ARE useful for filtering`;
}

// ── Agent 2: Theme Discovery ─────────────────────────────────────────

export const themeDiscoverySchema = z.object({
  categories: z.array(
    z.object({
      name: z.string().describe("Short, descriptive category name"),
      description: z
        .string()
        .describe("What types of comments fall into this category"),
      sampleIndices: z
        .array(z.number())
        .describe("Indices of sample comments that match this category"),
    })
  ),
});

export type ThemeDiscoveryOutput = z.infer<typeof themeDiscoverySchema>;

export function buildThemeDiscoveryPrompt(
  productName: string,
  productDescription: string | null,
  comments: { index: number; text: string; nps: number | null }[]
): string {
  const commentList = comments
    .map((c) => `[${c.index}] (NPS: ${c.nps ?? "N/A"}) ${c.text}`)
    .join("\n");

  return `You are analyzing NPS feedback for "${productName}"${
    productDescription ? ` — ${productDescription}` : ""
  }.

## Sample Comments
${commentList}

## Your Task
Analyze these comments and propose 5-10 thematic categories that capture the main topics users are discussing. Each category should:
- Have a clear, concise name (e.g., "Performance Issues", "Missing Features", "UI/UX Complaints")
- Include a description of what types of comments belong there
- Reference 3-5 sample comment indices that match

Guidelines:
- Categories should be specific enough to be actionable but broad enough to group multiple comments
- Look for recurring themes, pain points, feature requests, and praise
- Do NOT create a "General Feedback" category — that will be added automatically as a fallback
- Consider both positive and negative themes
- If many comments compare the product to competitors, that could be its own category`;
}

// ── Agent 2b: Classification ─────────────────────────────────────────

export const classificationSchema = z.object({
  classifications: z.array(
    z.object({
      index: z.number().describe("The comment index from the input"),
      category: z.string().describe("The category name this comment belongs to"),
      confidence: z
        .number()
        .min(0)
        .max(1)
        .describe("Confidence score from 0.0 to 1.0"),
      isActionable: z
        .boolean()
        .describe(
          "Whether this comment contains actionable feedback (false for nonsensical, single-word, redacted, or purely emotional comments)"
        ),
      reasoning: z
        .string()
        .describe("Brief one-sentence explanation of why this category was chosen"),
    })
  ),
});

export type ClassificationOutput = z.infer<typeof classificationSchema>;

export function buildClassificationPrompt(
  categories: { name: string; description: string }[],
  comments: { index: number; text: string }[]
): string {
  const categoryList = categories
    .map((c) => `- "${c.name}": ${c.description}`)
    .join("\n");

  const commentList = comments
    .map((c) => `[${c.index}] ${c.text}`)
    .join("\n");

  return `Classify each comment into one of the following categories:

## Categories
${categoryList}

## Comments
${commentList}

## Rules
- Each comment must be assigned exactly ONE category
- Use "General Feedback" for comments that don't clearly fit any other category
- Mark isActionable=false for: empty text, single words, "REDACTED", purely emotional outbursts without specific feedback, or nonsensical text
- Provide a confidence score (0.0-1.0) indicating how certain you are about the classification
- Keep reasoning to one brief sentence`;
}

// ── Agent 3: Summary Generator ───────────────────────────────────────

export function buildSummaryPrompt(input: {
  projectName: string;
  npsScore: number;
  totalResponses: number;
  promoters: number;
  passives: number;
  detractors: number;
  categoryBreakdown: { name: string; count: number; percentage: number }[];
  topComments: { category: string; comment: string; nps: number }[];
  noiseImpact: { filterName: string; excludedCount: number }[];
}): string {
  const categories = input.categoryBreakdown
    .map((c) => `- ${c.name}: ${c.count} comments (${c.percentage}%)`)
    .join("\n");

  const quotes = input.topComments
    .map((c) => `- [${c.category}, NPS ${c.nps}] "${c.comment}"`)
    .join("\n");

  const noise =
    input.noiseImpact.length > 0
      ? input.noiseImpact
          .map((n) => `- ${n.filterName}: ${n.excludedCount} comments excluded`)
          .join("\n")
      : "No noise filters applied.";

  return `Generate an NPS analysis report for "${input.projectName}".

## Data
- Total responses: ${input.totalResponses}
- NPS Score: ${input.npsScore}
- Promoters (9-10): ${input.promoters} (${Math.round((input.promoters / input.totalResponses) * 100)}%)
- Passives (7-8): ${input.passives} (${Math.round((input.passives / input.totalResponses) * 100)}%)
- Detractors (0-6): ${input.detractors} (${Math.round((input.detractors / input.totalResponses) * 100)}%)

## Category Breakdown
${categories}

## Key Quotes
${quotes}

## Noise Filter Impact
${noise}

## Output Format
Write a structured markdown report with these sections:
1. **Executive Summary** — 1 paragraph overview
2. **NPS Score Analysis** — what the score means, trend interpretation
3. **Top Themes** — for each major category: what users are saying, impact on NPS, recommended actions
4. **Key Quotes** — 2-3 most impactful quotes per major theme
5. **Recommendations** — prioritized list of suggested improvements
6. **Noise Filter Impact** — how excluded comments affect the analysis

Be specific, data-driven, and actionable. Avoid generic advice.`;
}

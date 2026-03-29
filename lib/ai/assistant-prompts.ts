/**
 * Builds a system prompt for the AI assistant based on the current page and context.
 * No RAG — context is injected directly into the prompt.
 */

interface PageContext {
  [key: string]: unknown;
}

const PAGE_GUIDANCE: Record<string, string> = {
  upload:
    "The user is on the data upload page. Help with CSV format requirements, column expectations, and troubleshooting upload issues. Required columns: a numeric NPS score (0-10) and a text comment column.",
  structure:
    "The user is on the structure review page. Help them decide which columns to include or exclude from analysis. The NPS score column and comment column are required.",
  categories:
    "The user is on the categories page. Help with reviewing AI-discovered themes, renaming categories, removing irrelevant ones, suggesting additional themes, or running AI scans for specific topics.",
  dashboard:
    "The user is on the dashboard page. Help analyze NPS scores, category breakdowns, comment trends, and provide actionable insights from the data.",
  noise:
    "The user is on the noise filters page. Help identify comments that should be excluded from NPS calculations (e.g., 'N/A', 'test', single-word responses, redacted text).",
  summary:
    "The user is on the summary page. Help with understanding the AI-generated summary report, its sections, and how to export or share findings.",
  github:
    "The user is on the GitHub integration page. Help with configuring the repository connection, understanding how NPS categories are exported as GitHub issues, and managing created issues.",
};

export function buildAssistantSystemPrompt(
  page: string,
  context: PageContext
): string {
  const pageGuidance = PAGE_GUIDANCE[page] || `The user is on the ${page} page.`;

  const contextLines: string[] = [];

  // Project metadata
  if (context.projectName) {
    contextLines.push(`Project: ${context.projectName}`);
  }
  if (context.projectDescription) {
    contextLines.push(`Description: ${context.projectDescription}`);
  }

  // Upload page context
  if (context.uploadStatus) {
    contextLines.push(`Upload status: ${context.uploadStatus}`);
  }
  if (context.fileName) {
    contextLines.push(`Uploaded file: ${context.fileName}`);
  }

  // Structure page context
  if (context.columns && Array.isArray(context.columns)) {
    const cols = context.columns as { name: string; included: boolean }[];
    const included = cols.filter((c) => c.included).map((c) => c.name);
    const excluded = cols.filter((c) => !c.included).map((c) => c.name);
    if (included.length) contextLines.push(`Included columns: ${included.join(", ")}`);
    if (excluded.length) contextLines.push(`Excluded columns: ${excluded.join(", ")}`);
  }

  // Categories page context
  if (context.categories && Array.isArray(context.categories)) {
    const cats = context.categories as { name: string; count: number }[];
    contextLines.push(`Discovered categories (${cats.length}):`);
    cats.forEach((c) => contextLines.push(`  - ${c.name}: ${c.count} comments`));
  }

  // Dashboard page context
  if (context.npsScore !== undefined) {
    contextLines.push(`NPS Score: ${context.npsScore}`);
  }
  if (context.totalResponses !== undefined) {
    contextLines.push(`Total responses: ${context.totalResponses}`);
  }
  if (context.promoterPct !== undefined) {
    contextLines.push(
      `Distribution: ${context.promoterPct}% promoters, ${context.passivePct}% passives, ${context.detractorPct}% detractors`
    );
  }
  if (context.categoryBreakdown && Array.isArray(context.categoryBreakdown)) {
    const cats = context.categoryBreakdown as { name: string; count: number; percentage: number }[];
    contextLines.push("Category breakdown:");
    cats.forEach((c) => contextLines.push(`  - ${c.name}: ${c.count} (${c.percentage}%)`));
  }
  if (context.activeFilters) {
    contextLines.push(`Active filters: ${JSON.stringify(context.activeFilters)}`);
  }

  // Noise page context
  if (context.noiseFilters && Array.isArray(context.noiseFilters)) {
    const filters = context.noiseFilters as { name: string; keywords: string[] }[];
    contextLines.push(`Active noise filters (${filters.length}):`);
    filters.forEach((f) => contextLines.push(`  - ${f.name}: ${f.keywords.join(", ")}`));
  }
  if (context.excludedCount !== undefined) {
    contextLines.push(`Comments excluded by noise filters: ${context.excludedCount}`);
  }

  // Summary page context
  if (context.summaryGenerated !== undefined) {
    contextLines.push(
      context.summaryGenerated
        ? "Summary report has been generated."
        : "Summary report has not been generated yet."
    );
  }

  const contextBlock = contextLines.length
    ? `\n\nCurrent context:\n${contextLines.join("\n")}`
    : "";

  return `You are an AI assistant for the NPS Insight Engine — an AI-powered NPS analysis platform for product managers. You help users understand their NPS data, navigate the workflow, and make data-driven decisions.

${pageGuidance}${contextBlock}

Guidelines:
- Be concise and actionable — product managers value brevity
- Reference specific data points from the context when available
- If you don't have enough context to answer, say so and suggest what the user can do
- When suggesting actions, be specific about which page or button to use
- Do not make up data — only reference what's in the context`;
}

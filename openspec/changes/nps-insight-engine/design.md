## Context

The NPS Insight Engine is a complete rewrite of an existing single-file React app (`src/App.js`, ~1034 lines) that analyzes NPS survey data for the MSSQL VS Code extension. The current app uses hardcoded regex rules to classify comments and loads a static CSV from `public/data.csv`. The rewrite transforms it into a generic, AI-powered platform where any PM can upload NPS data from any product and get structured insights.

The current app has no backend, no database, no routing, and no authentication. The rewrite introduces a full-stack architecture with persistent storage, AI-powered classification, and a multi-step project creation workflow.

## Goals / Non-Goals

**Goals:**
- Replace hardcoded regex classification with AI agents that adapt to any product's NPS data
- Provide a guided project creation flow: create → upload → validate → structure → categorize → dashboard
- Persist projects in SQL Server 2025 so PMs can return to previous analyses
- Support multiple LLM providers (Anthropic, OpenAI, Azure OpenAI, Ollama) — users bring their own API keys
- Maintain the current dashboard UX patterns (score cards, category breakdown, filters, sortable table) but make them dynamic
- Enable noise filtering that can exclude specific comment patterns from NPS score calculation

**Non-Goals:**
- Authentication and multi-user support (deferred to SaaS phase)
- Cloud deployment and infrastructure provisioning
- Vector embeddings and semantic search (SQL Server 2025 vector types reserved for future)
- Real-time collaboration or commenting features
- Survey platform integrations (CSV upload only)

## Decisions

### 1. Next.js 15 App Router over CRA or Vite

The current CRA app has no routing or server-side logic. Next.js App Router provides file-based routing, server components (for AI calls without exposing API keys to the browser), API routes (for CSV processing and DB operations), and React Server Actions (for form handling).

**Alternatives considered:**
- **Keep CRA + add Express backend**: Two separate processes, more complex setup, no SSR benefits
- **Vite + separate API**: Same two-process problem as CRA; Vite is faster for builds but doesn't solve the backend need
- **Remix**: Viable but smaller ecosystem and less community momentum than Next.js

### 2. TypeORM for SQL Server (pivoted from Drizzle ORM)

TypeORM is the only Node.js/TypeScript ORM with **native SQL Server 2025 VECTOR column type support** (`@Column("vector", { length: 1536 })`). It has mature, GA-level SQL Server support, full migration tooling, and decorator-based entity definitions that map cleanly to the database schema. The vector type maps directly to `number[]` in TypeScript.

**Why we pivoted from Drizzle:** Drizzle ORM does not have `mssql-core` support despite being referenced in some documentation — the module doesn't exist in the published package (v0.45.2). This was a blocking issue.

**Alternatives considered:**
- **Drizzle ORM**: No SQL Server support in current version — `drizzle-orm/mssql-core` doesn't exist
- **Prisma**: GA SQL Server support, but vector columns require `Unsupported("vector")` workaround + raw SQL for all vector operations. Migration tooling has known issues with Unsupported types.
- **Sequelize**: Mature SQL Server support, but no built-in vector type — requires custom DataType class
- **Knex.js**: Solid query builder with `specificType()` for vectors, but not a full ORM
- **MikroORM**: SQL Server support is newer (v6.2), no documented vector type support

### 3. Vercel AI SDK for multi-provider LLM abstraction

The `ai` package from Vercel provides a unified interface across providers (Anthropic, OpenAI, Azure OpenAI) with built-in support for structured output via Zod schemas, streaming responses, and tool calling. This means the categorization agent can output typed JSON validated at runtime without manual parsing.

**Alternatives considered:**
- **LangChain**: Feature-rich but heavy abstraction layer, often overkill for structured LLM calls
- **Direct provider SDKs**: Would require maintaining three different API clients and response parsers
- **LlamaIndex**: Focused on RAG, which we don't need yet

### 4. SQL Server 2025 in Docker over SQLite

The user explicitly chose SQL Server 2025 for its native VECTOR data type (dimensions 1–1998, float32, with built-in `VECTOR_DISTANCE()` for cosine/Euclidean/dot-product similarity). Running in Docker keeps the local setup self-contained. The TypeORM entity definitions are portable — switching to Azure SQL for cloud deployment is a config change.

**Alternatives considered:**
- **SQLite**: Simpler setup (no Docker needed), but lacks vector types and won't match the production target
- **PostgreSQL**: Excellent vector support via pgvector, but user prefers staying in the SQL Server ecosystem

### 5. Three focused AI agents over one monolithic agent

Separating concerns into Data Validator, Theme Discoverer/Classifier, and Summary Generator keeps prompts focused, allows different model selection per task (expensive model for discovery, cheap model for bulk classification), and makes each agent independently testable.

**Agent architecture:**

```
Agent 1: Data Validator (runs once per upload)
  Input:  { columns: string[], sampleRows: Record<string, any>[], rowCount: number }
  Output: { npsColumn: string, commentColumn: string, issues: string[],
            columnRecommendations: { column: string, include: boolean, reason: string }[] }
  Model:  Best available (Claude Sonnet / GPT-4o)

Agent 2: Theme Discoverer + Classifier (two phases)
  Phase A - Discovery:
    Input:  { productName: string, productDescription: string, sampleComments: string[] }
    Output: { categories: { name: string, description: string, sampleIndices: number[] }[] }
    Model:  Best available

  Phase B - Classification (batched, 20-30 comments per call):
    Input:  { categories: { name: string, description: string }[], comments: string[] }
    Output: { classifications: { index: number, category: string, confidence: number,
              isActionable: boolean, reasoning: string }[] }
    Model:  Fast/cheap (Claude Haiku / GPT-4o-mini)

Agent 3: Summary Generator (runs on demand)
  Input:  { projectName: string, npsScore: number, totalResponses: number,
            categoryBreakdown: { name: string, count: number, percentage: number }[],
            topComments: { category: string, comment: string, nps: number }[],
            noiseImpact: { filterName: string, excludedCount: number }[] }
  Output: Markdown string (streamed)
  Model:  Best available
```

### 6. Server-side CSV processing over client-side only

CSV files are uploaded to the server, validated, and stored (as raw data in the Comment table). This enables re-analysis without re-upload, supports larger files than browser memory allows, and keeps AI API keys server-side.

Client-side PapaParse is still used for the upload preview (first 5 rows) before the file is sent to the server.

### 7. Encrypted API key storage

LLM API keys are stored in the database encrypted using AES-256-GCM with a server-side encryption key (from environment variable). This is acceptable for a local-first tool. For SaaS deployment, this would move to a proper secrets manager.

## Data Flow

```
[User] → New Project (name, desc) → [DB: Project]
  ↓
[User] → Upload CSV → [Server: PapaParse + Zod validation]
  ↓
[Server] → AI Agent 1 (validate structure) → [User: review columns]
  ↓
[User] → Confirm structure → [DB: ReportStructure]
  ↓
[Server] → AI Agent 2a (discover themes from sample) → [User: review categories]
  ↓
[User] → Edit/confirm categories → [DB: Category]
  ↓
[Server] → AI Agent 2b (classify all comments in batches) → [DB: Comment]
  ↓
[User] → Dashboard (read from DB, apply filters, compute NPS)
  ↓
[User] → Noise Console → [DB: NoiseFilter] → Dashboard recalculates
  ↓
[User] → Generate Summary → AI Agent 3 → [DB: Summary] → Render/Download
```

## Risks / Trade-offs

**[LLM classification inconsistency]** → Different runs may categorize the same comment differently. Mitigation: Use structured output with Zod validation, include confidence scores, cache results in DB, allow user override per comment.

**[LLM cost for large datasets]** → 1000+ comments at $0.01-0.03 per classification call adds up. Mitigation: Batch 20-30 comments per request, use cheap models (Haiku/GPT-4o-mini) for bulk classification, cache results to avoid re-processing.

**[LLM latency during classification]** → Classifying 500 comments in batches of 25 = 20 API calls, potentially 30-60 seconds. Mitigation: Show progress bar, process in background with SSE updates, allow user to navigate away and return.

**[SQL Server Docker overhead]** → Requires Docker Desktop running, uses ~2GB RAM. Mitigation: Document clearly in README, provide docker-compose with health checks. Consider SQLite fallback for users without Docker (future enhancement).

**[TypeORM decorator complexity]** → TypeORM uses decorators which add boilerplate. Mitigation: Entity definitions are straightforward for this schema; the trade-off is worth it for native vector type support and mature SQL Server migrations.

**[API key security in local DB]** → Encrypted but the encryption key is in an env var on the same machine. Mitigation: Acceptable for local-first tool; document the security model; move to proper secrets management for SaaS phase.

## Migration Plan

This is a greenfield rewrite, not an incremental migration. The current `src/App.js` is preserved as reference but not modified.

1. Initialize Next.js project in the same repo (new `app/` directory replaces `src/`)
2. Set up Docker Compose for SQL Server 2025
3. Build features incrementally (Phase 0-4 per implementation plan)
4. Once the new app is functional, remove CRA artifacts (`src/`, `react-scripts` dep, CRA config)
5. No rollback needed — the old app remains accessible via git history

## Open Questions

1. **Comment-level override**: Should users be able to manually re-categorize individual comments, or only manage categories at the project level?
2. **Re-analysis behavior**: When uploading new CSV data to an existing project, should previously confirmed categories be reused as-is, or should the AI propose updates based on the new data?
3. **Ollama model selection**: Should the app auto-detect available Ollama models, or require the user to type the model name manually?

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

### 8. Dev Container for reproducible development

A Dev Container configuration (`.devcontainer/`) provides a one-click setup with Docker Compose orchestrating two services: an Ubuntu-based app container (with Node.js 22) and SQL Server 2025. VS Code extensions (MSSQL, ESLint, Prettier, Tailwind CSS, Docker, GitHub Copilot) are auto-installed, and a pre-configured SQL Server connection profile is included. Database and schema creation are handled by the app (TypeORM `synchronize: true`), not by container lifecycle hooks.

**Alternatives considered:**
- **Manual local setup**: Requires Docker, Node.js, and manual env configuration — error-prone for new contributors
- **Dockerfile only (no Compose)**: Would lose the SQL Server sidecar; users would need to manage it separately

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

## Best Practices Applied

### Security
- **Input sanitization**: Database name validated against `[a-zA-Z0-9_-]` pattern to prevent SQL injection in init scripts
- **No hardcoded secrets**: All passwords and keys come from `.env.local` (gitignored); `.env.example` documents required variables without values
- **API key encryption**: AES-256-GCM encryption for LLM API keys stored in the database, using a server-side key from environment
- **Security headers**: X-Frame-Options (DENY), X-Content-Type-Options (nosniff), Referrer-Policy, Permissions-Policy configured in `next.config.ts`
- **TypeORM synchronize guard**: Auto-schema sync disabled when `NODE_ENV=production` to prevent accidental schema mutations

### Performance
- **Server-side aggregation**: Dedicated `/api/projects/[id]/stats` endpoint computes NPS scores and category breakdowns via SQL `GROUP BY` instead of loading all rows to the client
- **N+1 elimination**: Project list computes comment counts and NPS scores in a single aggregation query instead of one query per project
- **Connection pooling**: TypeORM configured with `pool.max: 10, min: 2, idleTimeoutMillis: 30000`
- **Batch AI classification**: Comments processed in batches of 25 to balance throughput and API cost

### Reliability
- **Error boundary**: Global React error boundary (`app/error.tsx`) catches runtime errors with recovery UI
- **Database retry**: `getDb()` clears cached promise on initialization failure so subsequent calls retry instead of returning a stale rejected promise
- **CSV validation**: Multi-layer validation — client-side preview, server-side parse check, column type detection, then AI structure analysis

### Developer Experience
- **Dev Container**: One-click setup with Node.js 22, SQL Server 2025, and pre-configured VS Code extensions (MSSQL, ESLint, Prettier, Tailwind CSS, Docker, GitHub Copilot, Claude Code, OpenAI Codex)
- **`.env.example`**: Documented template with generation instructions for the encryption key
- **Client/server separation**: Client-safe constants (`lib/ai/models.ts`) separated from server-only provider imports (`lib/ai/providers.ts`) to prevent webpack bundling issues

### TypeORM + Next.js Compatibility
- **String-based relation targets**: All entity relations use string names (`@ManyToOne("Project", "dataSources")`) instead of class imports (`@ManyToOne(() => Project)`) to avoid circular dependency errors with webpack. No entity file imports another entity file.
- **Dynamic entity imports in API routes**: API routes import entities via `await import("@/lib/db/entities/X")` to avoid triggering entity resolution at module load time
- **Safe JSON parsing**: All client-side `res.json()` calls are wrapped in try/catch to handle non-JSON server errors (e.g., 500 HTML pages when DB is down)
- **No empty criteria on update/delete**: MSSQL driver rejects `repo.update({}, ...)`. Use `createQueryBuilder().update().set().execute()` instead.
- **Batch insert parameter limit**: MSSQL limits queries to 2,100 parameters. Batch size set to 50 rows (50 × 12 columns = 600 params) for safe margin.
- **Bulk updates over N+1 writes**: Noise filter matching uses a single `UPDATE...WHERE LIKE` query. Classification results batch-saved per AI batch instead of one-by-one.

### Vector Type Readiness
TypeORM 0.3.28 includes native `"vector"` column type support in the MSSQL driver (`supportedDataTypes`, DDL generation, default 255 dimensions). Combined with SQL Server 2025's native `VECTOR(n)` data type and `VECTOR_DISTANCE()` function, the stack is ready for future RAG/semantic search features. No entities currently use vector columns — this will be added in the SaaS phase.

### UI/UX
- **Dark mode by default**: Class-based Tailwind dark mode on all pages
- **Footer attribution**: Consistent "croblesm.com" branding on all pages via root layout
- **Responsive design**: Grid layouts adapt from mobile to desktop
- **Progressive disclosure**: 6-step sidebar navigation guides users through the workflow
- **Component decomposition**: Dashboard split into 5 reusable components (ScoreCards, CategoryBreakdown, SearchBar, FilterPanel, DataTable)

### Code Quality
- **Zod API validation**: All 11 API routes validate request bodies via `parseBody()` with typed Zod schemas, returning consistent `{ error }` responses on failure
- **Shared constants**: NPS thresholds (`NPS_THRESHOLDS`) and score labels (`NPS_LABELS`) defined once in `lib/nps/calculator.ts`, used everywhere
- **Unit tests**: 57 tests across 5 suites (NPS calculator, CSV validator, stratified sampler, API schemas, encryption) via Vitest
- **Test command**: `npm test` (Vitest in Node.js environment with `@/` path aliases)

## Risks / Trade-offs

**[LLM classification inconsistency]** → Different runs may categorize the same comment differently. Mitigation: Use structured output with Zod validation, include confidence scores, cache results in DB, allow user override per comment.

**[LLM cost for large datasets]** → 1000+ comments at $0.01-0.03 per classification call adds up. Mitigation: Batch 20-30 comments per request, use cheap models (Haiku/GPT-4o-mini) for bulk classification, cache results to avoid re-processing.

**[LLM latency during classification]** → Classifying 500 comments in batches of 25 = 20 API calls, potentially 30-60 seconds. Mitigation: Show progress bar, process in background with SSE updates, allow user to navigate away and return.

**[SQL Server Docker overhead]** → Requires Docker Desktop running, uses ~2GB RAM. On Apple Silicon Macs, runs under Rosetta x86 emulation (`platform: linux/amd64` in docker-compose). Mitigation: Document clearly in README including Rosetta prerequisite, provide docker-compose with health checks. Consider SQLite fallback for users without Docker (future enhancement).

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

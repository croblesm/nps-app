# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

NPS Insight Engine — a generic, AI-powered NPS (Net Promoter Score) analysis platform for product managers. Users upload CSV survey data, AI agents discover themes and classify comments, and the dashboard provides interactive analysis with noise filtering and summary reports.

## Commands

- **Dev server:** `npm run dev` (Next.js on localhost:3000)
- **Build:** `npm run build`
- **Start prod:** `npm start`
- **Test:** `npm test` (Vitest, 168 tests across 11 suites (run `npm test`))
- **Test watch:** `npm run test:watch`
- **DB init:** `npm run db:init` (creates database + tables via TypeORM)
- **Docker SQL Server:** `docker compose up -d` (starts SQL Server 2025 on port 1433)

## Dev Container

Open in VS Code with Dev Containers extension → "Reopen in Container". Provides Node.js 22, SQL Server 2025, and all VS Code extensions (MSSQL, ESLint, Prettier, Tailwind, Copilot). Copy `.devcontainer/.env.local` to `.env.local` for the correct `DATABASE_HOST=sqlserver`.

## Prerequisites (Local)

- Node.js 18+
- Docker Desktop (for SQL Server 2025)
- An LLM API key (Anthropic, OpenAI, Azure OpenAI, or local Ollama)

## Architecture

### Stack
- **Framework:** Next.js 15 (App Router), React 19, TypeScript
- **Styling:** Tailwind CSS 4 with shadcn/ui components, dark mode (class strategy, dark by default)
- **Database:** SQL Server 2025 (Docker), TypeORM (with native VECTOR type for embeddings)
- **Auth:** NextAuth.js v5 (GitHub, Google, credentials providers) — Edge-compatible config split (`auth.config.ts` for Edge, `auth.ts` for Node)
- **AI:** Vercel AI SDK (`ai` package) — multi-provider (Anthropic, OpenAI, Azure OpenAI, Ollama)
- **GitHub:** Octokit (GitHub issue creation from NPS data)
- **CSV:** PapaParse
- **Charts:** Recharts (PieChart, BarChart for NPS visualization)
- **Validation:** Zod (for AI structured output schemas)
- **Layout:** Collapsible sidebar (shadcn Sidebar) + minimal top bar, replaces top-nav + tabs

### Directory Structure
```
app/                          # Next.js App Router pages
  api/                        # API routes
    ai/{validate,categorize,classify,summarize,embed}/
    auth/                     # Auth API routes
      register/               #   Email/password registration
      profile/                #   User profile management
      [...nextauth]/          #   NextAuth.js catch-all route
    projects/[id]/            # Project CRUD + sub-resources
      {categories,comments,export,noise,structure}/
      chat/                   #   RAG chat messages (GET/POST)
      embeddings/             #   Generate/store comment embeddings
      github/                 #   GitHub integration (connect repo, create issues)
        issues/               #   Issue creation from categories/comments
      noise/
        count/                #   Keyword match count (no limit cap, for noise preview)
    settings/
      embeddings/               #   Embedding provider info (GET, read-only)
      ollama-models/            #   Ollama model discovery
      test/                     #   LLM connection test
    upload/
  admin/                      # Admin settings page (user management)
  login/                      # Login page (NextAuth)
  register/                   # Registration page
  project/[id]/               # Project pages (sidebar navigation)
    {upload,structure,categories,dashboard,noise,summary}/
    chat/                     #   RAG chat analysis page
    github/                   #   GitHub Issues page (config + issues tabs)
  settings/                   # LLM provider configuration
  new-project/                # Project creation
components/
  layout-wrapper.tsx          # Auth-gated layout: hides sidebar/topbar on /login, /register
  app-sidebar.tsx             # Collapsible left sidebar (project nav + back-to-projects + user footer)
  top-bar.tsx                 # Minimal h-12 top bar (sidebar trigger, breadcrumb, LLM status, theme, user avatar)
  providers.tsx               # SessionProvider + ThemeProvider wrapper
  nps/                        # NPS-specific components
    NpsVisualCards.tsx         #   Recharts pie chart + quotes (summary page)
    ScoreCards.tsx             #   NPS score cards with emoji indicators
    CategoryBreakdown.tsx     #   Category grid with "Create Issue" actions
    ChatPanel.tsx             #   RAG chat panel (dashboard FAB)
  ui/                         # Shared UI components (shadcn/ui, includes sidebar.tsx)
lib/
  ai/                         # LLM providers, prompts, encryption
    get-embedding-config.ts   #   Smart embedding provider resolution (auto-finds OpenAI/Azure/Ollama)
    assistant-prompts.ts      #   Page-aware system prompt builder for AI assistant
  csv/                        # CSV validator, sampler
  db/                         # TypeORM entities, data source, connection
    entities/                 #   Includes GitHubRepo, GitHubIssue, ChatMessage entities
  nps/                        # NPS calculation logic
lib/auth/
  index.ts                    # NextAuth.js config (Node runtime, providers, DB)
  config.ts                   # NextAuth.js config (Edge-compatible, JWT/session callbacks)
  get-user.ts                 # Server-side user resolution from session
  assert-project-access.ts    # Shared ownership guard for project-scoped API routes
openspec/                     # Spec-driven development artifacts
```

### Data Flow
1. Create project → Upload CSV → Validate structure (AI Agent 1)
2. User confirms report structure → AI discovers themes (Agent 2a)
3. User reviews/edits categories → AI classifies all comments (Agent 2b)
4. Dashboard: NPS cards, category breakdown, filters, sortable table
5. Noise Console: keyword filters that exclude from NPS score
6. AI Summary: markdown insight report (Agent 3)
7. Export: filtered CSV or project metadata JSON

### Key Conventions
- Server components by default, `"use client"` only for interactivity
- TypeORM entities in `lib/db/entities/` — use string-based relation targets, import dynamically in API routes to avoid circular deps
- All AI calls use Vercel AI SDK with Zod-validated structured output
- API routes use `getDb()` for lazy-initialized database connection
- **All project-scoped API routes** (`/api/projects/[id]/*` and `/api/ai/*`) MUST call `assertProjectAccess(projectId)` from `lib/auth/assert-project-access.ts` before processing. This verifies the current user owns the project. When `AUTH_REQUIRED=false`, the check is bypassed.
- Auth uses Edge-compatible config split: `lib/auth/config.ts` (Edge middleware) and `lib/auth/index.ts` (Node runtime with providers + DB). `SessionProvider` wraps the app in `components/providers.tsx`. JWT callback handles `trigger === "update"` for client-side session updates (e.g., name change)
- `components/layout-wrapper.tsx` conditionally renders the sidebar/topbar — auth pages (`/login`, `/register`) get a clean layout without navigation chrome. Do NOT use `useSession()` for this check — `AUTH_REQUIRED=false` means no session exists, which would hide the layout entirely
- GitHub integration entities (`GitHubRepo`, `GitHubIssue`) link to projects; Octokit handles GitHub API calls
- `ChatMessage` entity stores RAG chat history; comment embeddings stored as SQL Server VECTOR type for cosine similarity search
- The `/api/ai/embed` route uses SSE (Server-Sent Events) streaming via `ReadableStream` + `text/event-stream` content type to push real-time progress to the client; follow this pattern for any long-running pipeline routes
- `getEmbeddingConfig()` in `lib/ai/get-embedding-config.ts` auto-resolves an embedding-capable provider even when the default LLM (e.g., Anthropic) does not support embeddings
- `AUTH_REQUIRED=false` disables auth for local development (all projects accessible)
- **No hardcoded Tailwind colors** in `.tsx` files — use CSS variables only (`text-foreground`, `bg-card`, `bg-muted`, `border-border`, `bg-primary`, `text-destructive`, etc.). NPS domain colors use custom properties (`--nps-promoter`, `--nps-passive`, `--nps-detractor`, `--nps-excellent`) defined in `globals.css`
- **Error states on all data-fetching pages** — use `{ loading, error, data }` triple pattern. On fetch failure, show error message with Retry button. Never leave users in perpetual skeleton state.

## OpenSpec Workflow (MANDATORY)

This project uses **OpenSpec** with the `spec-driven` schema. All development follows this sequential workflow:

```
1. Proposal   → WHY (problem, capabilities)         openspec instructions proposal
2. Specs      → WHAT (requirements + scenarios)      openspec instructions specs
3. Design     → HOW (architecture, decisions)        openspec instructions design
4. Tasks      → DO (checklist from specs + design)   openspec instructions tasks
5. Apply      → Execute tasks one by one             /opsx:apply
6. Archive    → Merge specs to openspec/specs/       /opsx:archive
```

**Rules:**
- **Specs first, then code** — never write code before updating/creating the relevant spec
- **Tasks derived from specs** — use `openspec instructions tasks` to generate granular tasks (max 4 hours each, independently testable)
- **Execute via `/opsx:apply`** — reads tasks.md, tracks progress, walks through each task
- **Never remove spec features** — if not implemented, mark as "NOT YET IMPLEMENTED"
- **Commit per task group** — each commit includes spec + code + tests + docs

**Enforcement** via Claude Code hooks in `.claude/settings.json`:
- **Pre-commit hook** (`enforce-spec-update.sh`): Blocks `git commit` if code files (`app/`, `lib/`, `components/`) are staged without any spec/doc files (`openspec/`, `README.md`, `CLAUDE.md`)
- **Post-edit hook** (`remind-spec-update.sh`): Prints a reminder after editing code files

Exceptions: commits prefixed with `docs:` or `chore:` skip the check.

**Key commands:**
- `openspec status --change "<name>" --json` — check artifact progress
- `openspec instructions <artifact> --change "<name>"` — get creation guidelines
- `openspec list` — list active changes

## Installed Skills (auto-loaded, guide code quality)

These Claude Code skills from [skills.sh](https://skills.sh/) are installed globally and influence implementation patterns:

- `clean-code` — SOLID principles, naming, structure
- `optimized-nextjs-typescript` — Next.js 15 App Router + TypeScript best practices
- `shadcn-ui` — shadcn/ui component patterns and customization
- `security-patterns` — PII protection, input sanitization, secure defaults
- `rag-architect` + `rag-implementation` — RAG architecture, embeddings, vector retrieval
- `typescript-unit-testing` — Vitest patterns and test structure
- `typescript-e2e-testing` — E2E testing with Playwright
- `api-design-patterns` — REST API design, error handling, validation

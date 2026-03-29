# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

NPS Insight Engine — a generic, AI-powered NPS (Net Promoter Score) analysis platform for product managers. Users upload CSV survey data, AI agents discover themes and classify comments, and the dashboard provides interactive analysis with noise filtering and summary reports.

## Commands

- **Dev server:** `npm run dev` (Next.js on localhost:3000)
- **Build:** `npm run build`
- **Start prod:** `npm start`
- **Test:** `npm test` (Vitest, 141 tests across 10 suites)
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
- **Validation:** Zod (for AI structured output schemas)

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
    settings/
    upload/
  admin/                      # Admin settings page (user management)
  login/                      # Login page (NextAuth)
  register/                   # Registration page
  project/[id]/               # Project pages with top-nav + tabs layout
    {upload,structure,categories,dashboard,noise,summary}/
    chat/                     #   RAG chat analysis page
    github/                   #   GitHub integration page
  settings/                   # LLM provider configuration
  new-project/                # Project creation
components/
  providers.tsx               # SessionProvider + ThemeProvider wrapper
  ui/                         # Shared UI components (shadcn/ui)
lib/
  ai/                         # LLM providers, prompts, encryption
    get-embedding-config.ts   #   Smart embedding provider resolution (auto-finds OpenAI/Azure/Ollama)
  auth/                       # Auth utilities
    get-user.ts               #   Server-side user resolution from session
  csv/                        # CSV validator, sampler
  db/                         # TypeORM entities, data source, connection
    entities/                 #   Includes GitHubRepo, GitHubIssue, ChatMessage entities
  nps/                        # NPS calculation logic
auth.ts                       # NextAuth.js config (Node runtime, DB adapter)
auth.config.ts                # NextAuth.js config (Edge-compatible, no DB)
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
- Auth uses Edge-compatible config split: `auth.config.ts` (Edge middleware) and `auth.ts` (Node runtime with DB access). `SessionProvider` wraps the app in `components/providers.tsx`
- GitHub integration entities (`GitHubRepo`, `GitHubIssue`) link to projects; Octokit handles GitHub API calls
- `ChatMessage` entity stores RAG chat history; comment embeddings stored as SQL Server VECTOR type for cosine similarity search
- The `/api/ai/embed` route uses SSE (Server-Sent Events) streaming via `ReadableStream` + `text/event-stream` content type to push real-time progress to the client; follow this pattern for any long-running pipeline routes
- `getEmbeddingConfig()` in `lib/ai/get-embedding-config.ts` auto-resolves an embedding-capable provider even when the default LLM (e.g., Anthropic) does not support embeddings
- `AUTH_REQUIRED=false` disables auth for local development (all projects accessible)
- **No hardcoded Tailwind colors** in `.tsx` files — use CSS variables only (`text-foreground`, `bg-card`, `bg-muted`, `border-border`, `bg-primary`, `text-destructive`, etc.). NPS domain colors use custom properties (`--nps-promoter`, `--nps-passive`, `--nps-detractor`, `--nps-excellent`) defined in `globals.css`

## Workflow Rules (MANDATORY)

**EVERY code change MUST include:**
1. Update the relevant OpenSpec spec (`openspec/changes/nps-insight-engine/specs/`)
2. Update `README.md` if the change affects setup, usage, features, or configuration
3. Commit code + spec/doc updates together in one commit

This is enforced by Claude Code hooks in `.claude/settings.json`:
- **Pre-commit hook** (`enforce-spec-update.sh`): Blocks `git commit` if code files (`app/`, `lib/`, `components/`) are staged without any spec/doc files (`openspec/`, `README.md`, `CLAUDE.md`)
- **Post-edit hook** (`remind-spec-update.sh`): Prints a reminder after editing code files

Exceptions: commits prefixed with `docs:` or `chore:` skip the check.

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

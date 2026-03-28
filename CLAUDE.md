# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

NPS Insight Engine — a generic, AI-powered NPS (Net Promoter Score) analysis platform for product managers. Users upload CSV survey data, AI agents discover themes and classify comments, and the dashboard provides interactive analysis with noise filtering and summary reports.

## Commands

- **Dev server:** `npm run dev` (Next.js on localhost:3000)
- **Build:** `npm run build`
- **Start prod:** `npm start`
- **Test:** `npm test` (Vitest, 57 tests across 5 suites)
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
- **Styling:** Tailwind CSS 4 with dark mode (class strategy, dark by default)
- **Database:** SQL Server 2025 (Docker), TypeORM
- **AI:** Vercel AI SDK (`ai` package) — multi-provider (Anthropic, OpenAI, Azure OpenAI, Ollama)
- **CSV:** PapaParse
- **Validation:** Zod (for AI structured output schemas)

### Directory Structure
```
app/                          # Next.js App Router pages
  api/                        # API routes
    ai/{validate,categorize,classify,summarize}/
    projects/[id]/{categories,comments,export,noise,structure}/
    settings/
    upload/
  project/[id]/               # Project pages with sidebar layout
    {upload,structure,categories,dashboard,noise,summary}/
  settings/                   # LLM provider configuration
  new-project/                # Project creation
components/ui/                # Shared UI components (Header)
lib/
  ai/                         # LLM providers, prompts, encryption
  csv/                        # CSV validator, sampler
  db/                         # TypeORM entities, data source, connection
  nps/                        # NPS calculation logic
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
- TypeORM entities in `lib/db/entities/` — import dynamically in API routes to avoid circular deps
- All AI calls use Vercel AI SDK with Zod-validated structured output
- API routes use `getDb()` for lazy-initialized database connection

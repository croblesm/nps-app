## Why

Product managers need a flexible, AI-powered tool to analyze NPS survey data from any product — not just one hardcoded tool. The current app is a single-file React SPA built specifically for the MSSQL VS Code extension, using rigid regex-based rules that require code changes to update categories or classification logic. PMs outside this team cannot use it without rewriting the rules. By replacing hardcoded rules with AI agents and making the tool generic, any PM can upload their NPS CSV data and get structured, actionable insights without writing code.

## What Changes

- **New**: Project creation flow — users define their product context (name, description) and upload CSV data
- **New**: AI-powered data validation — an agent analyzes CSV structure, identifies NPS/comment columns, recommends columns to include/exclude
- **New**: User-confirmed report structure — users review and approve which columns appear in the analysis
- **New**: AI-powered theme discovery — an agent proposes categories from a sample of comments, with descriptions and examples
- **New**: User-editable categories — users can rename, merge, delete, or add categories before classification
- **New**: AI-powered bulk classification — an agent classifies all comments into confirmed categories with confidence scores
- **New**: Non-actionable comment detection — AI flags nonsensical, single-word, redacted, or purely emotional feedback
- **New**: Noise/pollution console — configurable keyword-based filters that can exclude matching comments from NPS score calculation
- **New**: AI summary report — on-demand markdown report with executive summary, theme analysis, key quotes, and recommendations
- **New**: Project persistence — SQL Server 2025 database stores projects, categories, noise filters, and classified comments
- **New**: Multi-provider LLM configuration — users bring their own API key for Anthropic, OpenAI, Azure OpenAI, or Ollama
- **New**: Project metadata export/import — save and reuse project configuration across analyses
- **New**: Dev Container support — one-click setup with Node.js 22, SQL Server 2025, and VS Code extensions (MSSQL, ESLint, Prettier, Tailwind, Copilot)
- **New**: Footer attribution — "croblesm.com" branding on all pages
- **New**: Security hardening — input sanitization, security headers, encrypted API key storage, environment-guarded TypeORM synchronize
- **New**: Performance optimizations — server-side NPS aggregation, connection pooling, N+1 query elimination
- **New**: Error boundary — graceful error handling with recovery UI
- **BREAKING**: Complete rewrite from CRA single-file app to Next.js 15 App Router with TypeScript
- **Removed**: Hardcoded regex-based rule engine (CATEGORY_RULES, AREA_RULES, USER_TYPE_RULES, CONSTRUCTIVE_RULES)
- **Removed**: Hardcoded ADS/SSMS toggle (replaced by configurable noise filters)
- **Removed**: Static CSV loading from `public/data.csv` (replaced by upload flow)

## Non-Goals

- Authentication/authorization (deferred to SaaS phase)
- Cloud deployment (local-first via `next dev`)
- Vector/RAG semantic search (SQL Server 2025 vector types reserved for future)
- Multi-tenancy, billing, or user management
- Real-time collaboration between users
- Direct integration with survey platforms (Qualtrics, SurveyMonkey) — CSV upload only

## User Flow

1. **Home** → List saved projects or create new one
2. **New Project** → Enter tool name + description → Upload CSV
3. **Data Validation** → System validates CSV, AI recommends column structure → User confirms
4. **Category Discovery** → AI proposes themes with sample comments → User reviews/edits → Confirms
5. **Classification** → AI classifies all comments (progress indicator) → Dashboard ready
6. **Dashboard** → NPS score cards, category breakdown, filters, search, sortable table
7. **Noise Console** → Create/manage noise filters, toggle NPS exclusion
8. **Summary** → Generate AI insight report, download as markdown

## Capabilities

### New Capabilities
- `project-management`: Project creation, listing, persistence, and metadata export/import
- `csv-upload-validation`: CSV file upload, parsing, and AI-powered structure validation
- `ai-categorization`: AI theme discovery, user review/editing of categories, and bulk comment classification
- `nps-dashboard`: Dynamic NPS score cards, category breakdown, filters, search, and sortable data table
- `noise-filters`: Configurable keyword-based noise filters with NPS score exclusion
- `ai-summary`: On-demand AI-generated markdown insight report
- `llm-configuration`: Multi-provider LLM settings with API key management
- `data-export`: Filtered CSV download and project metadata export/import
- `dev-environment`: Dev Container setup, .env management, security headers, TypeORM guards, footer attribution, error boundary, server-side aggregation, connection pooling, input sanitization
- `code-quality`: Component decomposition, shared NPS constants, Zod API validation, consistent error format, unit tests (57 tests), Vitest configuration

### Modified Capabilities
<!-- No existing specs to modify — this is a greenfield rewrite -->

## Impact

- **Code**: Complete rewrite — CRA (`src/App.js`) replaced by Next.js App Router (`app/` directory) with TypeScript
- **Dependencies**: Replace `react-scripts` with `next`; add `typeorm`, `tedious`, `ai`, `@ai-sdk/anthropic`, `@ai-sdk/openai`, `zod`
- **Infrastructure**: New SQL Server 2025 Docker container required for local development
- **Dev Container**: `.devcontainer/` provides one-click setup with Node.js 22, SQL Server 2025, and pre-configured VS Code extensions (MSSQL, ESLint, Prettier, Tailwind, Copilot)
- **Data**: CSV files no longer stored in `public/`; uploaded via the app and processed server-side
- **Build**: CRA scripts replaced by Next.js build system

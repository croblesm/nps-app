## 1. Project Scaffold and Infrastructure

- [x] 1.1 Initialize Next.js 15 project with App Router and TypeScript in the existing repo (replace CRA setup)
- [x] 1.2 Install core dependencies: next, react, drizzle-orm, tedious, drizzle-kit, papaparse, zod, ai, @ai-sdk/anthropic, @ai-sdk/openai, tailwindcss v4
- [x] 1.3 Create docker-compose.yml for SQL Server 2025 container with health checks and volume persistence
- [x] 1.4 Configure Tailwind CSS 4 with dark mode (class strategy), set up root layout with ThemeProvider
- [x] 1.5 Create TypeORM entities (lib/db/entities/) with all tables: Project, DataSource, ReportStructure, Category, NoiseFilter, Comment, Summary, LLMConfig
- [x] 1.6 Configure TypeORM data source (lib/db/data-source.ts) for SQL Server connection with synchronize for dev
- [x] 1.7 Create database connection module (lib/db/index.ts) with lazy-initialized DataSource singleton
- [x] 1.8 Verify: `docker compose up` starts SQL Server, `npm run dev` starts Next.js, TypeORM synchronize creates tables

## 2. LLM Configuration

- [x] 2.1 Create LLM provider abstraction (lib/ai/providers.ts) using Vercel AI SDK with support for Anthropic, OpenAI, Azure OpenAI, and Ollama
- [x] 2.2 Create API key encryption/decryption utility (lib/ai/encryption.ts) using AES-256-GCM with env var key
- [x] 2.3 Build settings page (app/settings/page.tsx) with provider selector, API key input, model selector, and Azure/Ollama-specific fields
- [x] 2.4 Create API route (app/api/settings/route.ts) for CRUD operations on LLMConfig table
- [x] 2.5 Implement test connection endpoint (app/api/settings/test/route.ts) that validates API key by making a simple LLM call
- [x] 2.6 Add active provider indicator in the app header/navigation
- [x] 2.7 Verify: configure Anthropic API key, test connection succeeds, key is stored encrypted in DB

## 3. Project Management

- [x] 3.1 Build home page (app/page.tsx) listing all saved projects with name, creation date, and NPS score preview
- [x] 3.2 Create new project page (app/new-project/page.tsx) with form: tool name, description
- [x] 3.3 Create API routes for project CRUD (app/api/projects/route.ts, app/api/projects/[id]/route.ts)
- [x] 3.4 Add project deletion with confirmation modal
- [x] 3.5 Create project layout shell (app/project/[id]/layout.tsx) with navigation sidebar showing project steps
- [x] 3.6 Verify: create a project, see it listed on home page, open it, delete it

## 4. CSV Upload and Validation

- [x] 4.1 Build CSV upload page (app/project/[id]/upload/page.tsx) with drag-and-drop zone and file picker
- [x] 4.2 Implement client-side CSV preview using PapaParse: show first 5 rows in a table after file selection
- [x] 4.3 Create upload API route (app/api/upload/route.ts): receive file, validate size (max 10MB), parse with PapaParse, detect column types and null percentages
- [x] 4.4 Create Zod schemas for CSV validation (lib/csv/validator.ts): require at least one numeric column and one text column
- [x] 4.5 Store validation results in DataSource table (columns, row_count, validation_status, validation_notes)
- [x] 4.6 Show validation results to user: pass/fail indicators per check, column summary with types and null %
- [x] 4.7 Verify: upload public/data.csv, see 5-row preview, see validation pass with column details

## 5. AI Data Validation Agent

- [x] 5.1 Create AI validation prompt template (lib/ai/prompts.ts): analyze column headers, types, and 20 sample rows
- [x] 5.2 Define Zod output schema for validator agent: { npsColumn, commentColumn, issues[], columnRecommendations[] }
- [x] 5.3 Create AI validate API route (app/api/ai/validate/route.ts) using Vercel AI SDK with structured output
- [x] 5.4 Build report structure review page (app/project/[id]/structure/page.tsx): display columns with AI recommendations, toggle include/exclude, show reasoning
- [x] 5.5 Create API route to save confirmed structure (app/api/projects/[id]/structure/route.ts) to ReportStructure table
- [x] 5.6 Verify: after CSV upload, AI correctly identifies NPS and Comments columns, recommends excluding low-value columns

## 6. AI Theme Discovery and Category Management

- [x] 6.1 Create stratified sampling utility (lib/csv/sampler.ts): select 50-100 comments balanced across NPS score ranges
- [x] 6.2 Create AI theme discovery prompt template: analyze sample comments for product, propose 5-10 categories with descriptions and sample indices
- [x] 6.3 Define Zod output schema for theme discovery: { categories: { name, description, sampleIndices[] }[] }
- [x] 6.4 Create AI categorize API route — discovery phase (app/api/ai/categorize/route.ts)
- [x] 6.5 Build category review page (app/project/[id]/categories/page.tsx): list proposed categories with name, description, sample comments, edit/merge/delete/add controls
- [x] 6.6 Implement category editing: rename inline, merge two categories modal, delete with reassignment to General Feedback, add custom category form
- [x] 6.7 Enforce "General Feedback" as mandatory fallback (cannot be deleted, always present)
- [x] 6.8 Create API route to save confirmed categories (app/api/projects/[id]/categories/route.ts) to Category table
- [x] 6.9 Verify: AI proposes meaningful categories from data.csv, user can edit them, General Feedback cannot be deleted

## 7. AI Bulk Classification

- [x] 7.1 Create AI classification prompt template for batches of 20-30 comments against confirmed categories
- [x] 7.2 Define Zod output schema for classification: { classifications: { index, category, confidence, isActionable, reasoning }[] }
- [x] 7.3 Implement batch classification loop in API route with progress tracking via Server-Sent Events
- [x] 7.4 Store classification results in Comment table: category_id, ai_confidence, ai_reasoning, is_actionable
- [x] 7.5 Implement deterministic no-comment detection: flag empty/whitespace comments as "No Comment" before AI classification
- [x] 7.6 Implement non-actionable detection: AI flags nonsensical, single-word, redacted, emotional-only comments
- [x] 7.7 Build classification progress UI: progress bar with percentage, comment count, estimated time remaining
- [x] 7.8 Support re-classification: when categories change, re-run classification on all comments
- [x] 7.9 Verify: all 384 comments from data.csv are classified, progress bar works, non-actionable comments flagged

## 8. NPS Dashboard

- [x] 8.1 Extract NPS calculation logic into lib/nps/calculator.ts: promoter/passive/detractor counts, NPS score, emoji indicators
- [x] 8.2 Build score cards component (components/nps/ScoreCards.tsx): Total Responses, Promoters, Passives, Detractors, NPS Score — clickable to filter
- [x] 8.3 Build category breakdown component (components/nps/CategoryBreakdown.tsx): dynamic grid of cards with count/percentage, clickable, sorted by percentage
- [x] 8.4 Build search bar component (components/nps/SearchBar.tsx): full-text search across comment text
- [x] 8.5 Build filter panel component (components/nps/FilterPanel.tsx): dynamic dropdowns generated from report structure columns + Category + Actionable
- [x] 8.6 Build sortable data table component (components/nps/DataTable.tsx): dynamic columns, sortable headers, pagination (10/25/50/100 rows per page)
- [x] 8.7 Create dashboard page (app/project/[id]/dashboard/page.tsx): compose all components, wire up filter/search/sort state with AND logic
- [x] 8.8 Create API route to fetch filtered/paginated comments (app/api/projects/[id]/comments/route.ts)
- [x] 8.9 Implement dark mode toggle in root layout, ensure all components respect dark mode
- [x] 8.10 Verify: dashboard shows NPS score of 18 for data.csv, filters work, search works, table sorts correctly

## 9. Noise/Pollution Console

- [x] 9.1 Build noise filter management page (app/project/[id]/noise/page.tsx): create/edit/delete noise filters
- [x] 9.2 Create noise filter form: name, description, comma-separated keywords, "Exclude from NPS" toggle
- [x] 9.3 Implement match preview: show count and sample of comments matching the filter keywords before activation
- [x] 9.4 Create API routes for noise filter CRUD (app/api/projects/[id]/noise/route.ts)
- [x] 9.5 Integrate noise filters with dashboard: recalculate NPS score excluding noise-filtered comments when exclusion is active
- [x] 9.6 Mark noise-matched comments in Comment table (is_noise flag) for display in dashboard table
- [x] 9.7 Verify: create "ADS/SSMS" noise filter with keywords, preview shows ~99 matches, NPS score changes when exclusion is toggled

## 10. AI Summary Report

- [x] 10.1 Create AI summary prompt template: receive project metadata, NPS stats, category breakdown, top comments, noise impact
- [x] 10.2 Create AI summarize API route (app/api/ai/summarize/route.ts) with streaming response
- [x] 10.3 Build summary page (app/project/[id]/summary/page.tsx): trigger generation button, render markdown in-app, download as .md
- [x] 10.4 Install and configure react-markdown for in-app markdown rendering
- [x] 10.5 Persist summary in Summary table with timestamp and model info
- [x] 10.6 Support regeneration: create new summary version, keep previous versions accessible
- [x] 10.7 Verify: generate summary from data.csv analysis, rendered markdown looks correct, download works

## 11. Data Export

- [x] 11.1 Implement filtered CSV download: export currently filtered/visible data including Category and Actionable columns
- [x] 11.2 Implement project metadata export: JSON file with project config, report structure, category definitions, noise filters (no raw data)
- [x] 11.3 Implement metadata import on new project creation: upload JSON, pre-configure categories and noise filters
- [x] 11.4 Add export filename convention: {project-name}_{date}.csv / {project-name}_metadata_{date}.json
- [x] 11.5 Verify: export filtered CSV, re-import metadata into new project, categories and noise filters are pre-populated

## 12. Integration Testing and Cleanup

- [ ] 12.1 End-to-end test: create project → upload data.csv → validate → confirm structure → discover categories → classify → dashboard → noise filter → summary → export
- [x] 12.2 Remove CRA artifacts: src/App.js, src/App-simple.js, src/App_bk.js, react-scripts dependency, CRA config files
- [x] 12.3 Update CLAUDE.md with new project structure, commands, and architecture
- [x] 12.4 Update README.md with setup instructions: Docker, environment variables, getting started
- [ ] 12.5 Verify: clean clone → docker compose up → npm install → npm run dev → full workflow completes successfully

## 13. Dev Environment and Best Practices

- [x] 13.1 Create Dev Container config (.devcontainer/) with Node.js 22, SQL Server 2025 sidecar, and VS Code extensions
- [x] 13.2 Add pre-configured MSSQL connection profile in devcontainer.json
- [x] 13.3 Create .env.example with documented variables and key generation instructions
- [x] 13.4 Update .gitignore to exclude .env files while keeping .env.example
- [x] 13.5 Remove hardcoded password fallbacks from source code (data-source.ts, init.ts)
- [x] 13.6 Add SQL injection protection: validate database name in init.ts
- [x] 13.7 Add security headers in next.config.ts (X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy)
- [x] 13.8 Guard TypeORM synchronize to development-only via NODE_ENV check
- [x] 13.9 Add connection pooling to TypeORM DataSource (max: 10, min: 2)
- [x] 13.10 Replace N+1 project list query with single SQL aggregation
- [x] 13.11 Add server-side /api/projects/[id]/stats endpoint for NPS aggregation
- [x] 13.12 Separate client-safe model constants (lib/ai/models.ts) from server-only providers
- [x] 13.13 Add React error boundary (app/error.tsx) with recovery UI
- [x] 13.14 Fix getDb() to retry on initialization failure
- [x] 13.15 Add footer attribution (croblesm.com) to root layout
- [x] 13.16 Add input validation on POST /api/projects (name length, type checks)
- [x] 13.17 Create dev-environment spec with all best practice requirements and scenarios

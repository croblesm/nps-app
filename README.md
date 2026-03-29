# NPS Insight Engine

[![Open in GitHub Codespaces](https://github.com/codespaces/badge.svg)](https://codespaces.new/croblesm/nps-app?quickstart=1)
[![Open in Dev Containers](https://img.shields.io/static/v1?style=for-the-badge&label=Dev%20Containers&message=Open&color=blue&logo=visualstudiocode)](https://vscode.dev/redirect?url=vscode://ms-vscode-remote.remote-containers/cloneInVolume?url=https://github.com/croblesm/nps-app)

An AI-powered NPS (Net Promoter Score) analysis platform for product managers. Upload CSV survey data, let AI discover themes and classify comments, then explore insights through an interactive dashboard with noise filtering and summary reports.

## Features

- **Project-based analysis** — Create projects for different products, persist and revisit analyses
- **CSV upload with validation** — Drag-and-drop upload, automatic column type detection, data quality checks
- **AI-powered structure analysis** — AI agent recommends which columns to include/exclude from your report
- **AI theme discovery** — AI proposes 5-10 thematic categories from a stratified sample of your comments
- **Category management** — Rename, remove, or add custom categories; "General Feedback" as mandatory fallback
- **AI bulk classification** — Classifies all comments into confirmed categories with confidence scores
- **Non-actionable detection** — AI flags nonsensical, single-word, redacted, or purely emotional feedback
- **Interactive dashboard** — Clickable NPS score cards, category breakdown grid, full-text search, sortable paginated table
- **Noise filters** — Keyword-based filters that can exclude comments from NPS score calculation
- **AI summary report** — On-demand markdown report with executive summary, theme analysis, key quotes, and recommendations
- **RAG chat analysis** — Ask natural language questions about your NPS data via a floating chat button (bottom-right FAB on the dashboard); vector embeddings + cosine similarity search retrieve relevant comments, LLM generates cited answers
- **Smart embedding provider** — Auto-detects an embedding-capable provider (OpenAI, Azure OpenAI, Ollama) even when the default LLM is Anthropic; Ollama auto-pulls the embedding model (`nomic-embed-text`) if it is not installed
- **SSE embedding pipeline** — The `/api/ai/embed` route streams progress updates via Server-Sent Events so the UI can show real-time batch progress
- **GitHub integration** — Connect a repo, export NPS categories as GitHub issues with impact summaries, representative quotes, and recommendations; auto-creates labels; tracks all created issues
- **Data export** — Download filtered CSV or project metadata JSON (categories, noise filters, structure)
- **Multi-provider LLM** — Bring your own API key: Anthropic (priority), OpenAI, Azure OpenAI, or Ollama (local)
- **Dark mode** — Enabled by default, full dark theme throughout

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| UI | React 19 + Tailwind CSS 4 |
| Database | SQL Server 2025 (Docker) |
| ORM | TypeORM (native SQL Server VECTOR type support) |
| AI | Vercel AI SDK — multi-provider |
| CSV Parsing | PapaParse |
| Validation | Zod (AI structured output) |

## Prerequisites

- **Node.js** 18 or later
- **Docker Desktop** (for SQL Server 2025) — Apple Silicon users: enable "Use Rosetta for x86_64/amd64 emulation" in Docker Desktop → Settings → General
- **LLM API key** — one of:
  - [Anthropic API key](https://console.anthropic.com/) (recommended)
  - [OpenAI API key](https://platform.openai.com/)
  - Azure OpenAI endpoint + key
  - [Ollama](https://ollama.com/) running locally (no key needed)

## Quick Start (Dev Container — Recommended)

The fastest way to get started. Requires [VS Code](https://code.visualstudio.com/) with the [Dev Containers extension](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers) and Docker Desktop.

1. Clone the repo and open in VS Code
2. When prompted, click **"Reopen in Container"** (or run `Dev Containers: Reopen in Container` from the command palette)
3. Wait for the container to build — this installs Node.js 22, SQL Server 2025, and all VS Code extensions automatically
4. Copy the devcontainer env file: `cp .devcontainer/.env.local .env.local`
5. Install dependencies: `npm install`
6. Initialize the database: `npm run db:init`
7. Start the dev server: `npm run dev`
8. Open [http://localhost:3000](http://localhost:3000) and configure your LLM at `/settings`

**Included VS Code extensions:**
- MSSQL extension (connect to SQL Server, run queries, browse objects)
- SQL Database Projects
- ESLint, Prettier, Tailwind CSS IntelliSense
- Docker, TypeScript Nightly
- GitHub Copilot + Copilot Chat
- Claude Code, OpenAI Codex

**Pre-configured SQL Server connection:** The MSSQL extension comes with a saved connection profile — just click it in the SQL Server sidebar to connect (no manual setup needed).

---

## Quick Start (Local — Without Dev Container)

### 1. Clone and install

```bash
git clone <repo-url>
cd nps-app
npm install
```

### 2. Start SQL Server

```bash
docker compose up -d
```

> **Apple Silicon (M1/M2/M3/M4) users:** The SQL Server image runs under x86 emulation via Rosetta. Make sure **"Use Rosetta for x86_64/amd64 emulation on Apple Silicon"** is enabled in Docker Desktop → Settings → General.

This starts SQL Server 2025 on port 1433 with:
- Username: `sa`
- Password: `NpsEngine@2025`
- Database: `nps_insight_engine` (created automatically)
- Memory limit: 2GB (matches existing local SQL Server containers)

Wait ~30 seconds for the container to be healthy:
```bash
docker compose ps   # Should show "healthy"
```

### 3. Initialize the database

```bash
npm run db:init
```

This creates the `nps_insight_engine` database and all tables via TypeORM.

### 4. Configure environment

Copy the example env file and fill in your values:

```bash
cp .env.example .env.local
```

Edit `.env.local`:
- Set `DATABASE_PASSWORD` to match your Docker Compose `MSSQL_SA_PASSWORD`
- Generate a secure encryption key: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
- Set `ENCRYPTION_KEY` to the generated value

### 5. Start the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### 6. Configure your LLM provider

Go to [http://localhost:3000/settings](http://localhost:3000/settings) and configure your LLM provider.

#### Option A: Cloud provider (API key required)

| Provider | API Key | Recommended Model |
|----------|---------|------------------|
| **Anthropic** | [console.anthropic.com](https://console.anthropic.com/) | `claude-sonnet-4-6` (best quality) or `claude-haiku-4-5-20251001` (fastest/cheapest) |
| **OpenAI** | [platform.openai.com](https://platform.openai.com/) | `gpt-4o` (best quality) or `gpt-4o-mini` (fastest/cheapest) |
| **Azure OpenAI** | Azure portal | Your deployment name (requires endpoint URL + API key) |

1. Select provider, enter API key, select model
2. Click "Test Connection" to verify
3. Click "Save Configuration"

#### Option B: Local model with Ollama (no API key, free, private)

Run AI models entirely on your machine — no data leaves your computer.

1. **Install Ollama**: [ollama.com/download](https://ollama.com/download)

2. **Pull a model** (choose based on your hardware):

   | Model | RAM Needed | Best For |
   |-------|-----------|----------|
   | `llama3.1:8b` | 8GB | Faster, good for classification |
   | `llama3.1:70b` | 48GB | Higher quality, better theme discovery |
   | `mistral` | 8GB | Fast, good general performance |
   | `qwen2.5:14b` | 16GB | Good balance of speed and quality |

   ```bash
   ollama pull llama3.1:8b
   ```

3. **Start Ollama** (if not already running):
   ```bash
   ollama serve
   ```

4. **Configure in the app**:
   - Provider: **Ollama (Local)**
   - Server URL: `http://localhost:11434/v1` (default, usually no change needed)
   - Model: the model name you pulled (e.g., `llama3.1:8b`)
   - No API key needed
   - Click "Test Connection" then "Save Configuration"

> **Note**: For Dev Container users, Ollama must run on your **host machine** (not inside the container). Use `http://host.docker.internal:11434/v1` as the server URL instead of `localhost`.

#### Switching providers

You can change your LLM provider at any time from the Settings page. The active provider is shown in the app header. Cloud and local providers can coexist — configure multiple and switch the "active" toggle.

## Usage Workflow

### Step 1: Create a Project
Click "New Project", enter the product name and description (e.g., "MSSQL VS Code Extension"). Optionally add **Analysis Focus** hints to guide the AI — e.g., "Focus on competitor comparisons with SSMS and Azure Data Studio, performance issues, and missing features."

### Step 2: Upload CSV Data
Drag and drop your NPS survey CSV file. The system shows a 5-row preview, then validates the file:
- Checks for corruption and file size (max 10MB)
- Detects column types (numeric, text, date)
- Reports null percentages per column

### Step 3: Review Report Structure
Click "Analyze Data Structure" — the AI agent examines your columns and recommends:
- Which column is the NPS score (0-10)
- Which column contains free-text comments
- Which columns to include or exclude from the analysis

Toggle columns on/off and click "Confirm Structure".

### Step 4: Discover Categories
Click "Discover Categories" — the AI agent samples 75 comments (stratified across promoters/passives/detractors) and proposes 5-10 thematic categories with:
- Category name and description
- 3-5 sample comments showing why the category was proposed
- Analysis hints from Step 1 are passed to the AI as guidance

After discovery, you can:
- **Rename** categories (click the name)
- **Remove** categories you don't need
- **"Suggest More"** — ask the AI for 2-3 additional themes it missed
- **Add custom category** with name + description + **"AI Scan"** to validate the theme against your data (shows matching comments and whether the theme is strong enough)
- **Re-discover** — re-run AI discovery if results aren't satisfactory

"General Feedback" is always present as a mandatory fallback. Click "Confirm Categories" to proceed.

### Step 5: Classify Comments
On the Dashboard page, click "Classify All Comments". The AI processes comments in batches of 25, assigning each a category, confidence score, and actionability flag. Empty comments are flagged deterministically as "No Comment".

### Step 6: Explore the Dashboard
- **Score cards**: Total Responses, Promoters (9-10), Passives (7-8), Detractors (0-6), NPS Score — click to filter
- **Category breakdown**: Click any category card to filter the table
- **Search**: Full-text search across all comments
- **Filters**: Actionable/Non-actionable, rows per page
- **Table**: Sortable by NPS, Category, Comment, or Confidence

### Step 7: Configure Noise Filters (Optional)
Go to the Noise Filters page to create keyword-based filters:
- Example: "ADS/SSMS Comparisons" with keywords `ADS, SSMS, Azure Data Studio`
- Toggle "Exclude from NPS score" to remove noisy comments from the NPS calculation
- Preview how many comments match before activating

### Step 8: Generate AI Summary (Optional)
Go to the AI Summary page and click "Generate Summary" for a markdown report including:
- Executive summary
- NPS score analysis
- Top themes with impact assessment
- Key quotes per theme
- Prioritized recommendations
- Noise filter impact statement

Download as `.md` file or view in-app.

### Step 9: Chat with Your Data (Optional)
Click the floating chat button (bottom-right of the dashboard) or go to the Chat tab. If embeddings haven't been generated yet, clicking the button triggers embedding generation automatically (the system auto-detects an embedding-capable provider — OpenAI, Azure OpenAI, or Ollama — even if your default LLM is Anthropic). Progress streams in real time via SSE. Once ready, ask natural language questions like:
- "What are the top complaints from detractors?"
- "What do promoters love most?"
- "Are there any comments about performance issues?"

The system retrieves relevant comments via cosine similarity and generates a cited answer.

### Step 10: Export to GitHub Issues (Optional)
Go to the GitHub tab, connect a repository, then:
- **Export categories**: Creates one issue per NPS category with impact summary, quotes, and recommendations
- **Export comments**: Create issues from selected individual comments
- Labels are auto-created in the repo. All issues are tracked in the GitHub tab.

### Step 11: Export Data
Use the export API endpoints:
- **Filtered CSV**: `GET /api/projects/{id}/export?format=csv`
- **Project metadata**: `GET /api/projects/{id}/export?format=metadata`

## Project Structure

```
nps-app/
  .devcontainer/                    # Dev Container configuration
    devcontainer.json               #   Container settings, extensions, ports
    docker-compose.yml              #   App + SQL Server services
    .env.local                      #   Environment vars for devcontainer
  app/                              # Next.js App Router
    api/                            # API routes
      ai/                           # AI agent endpoints
        validate/                   #   Data structure validation
        categorize/                 #   Theme discovery
        classify/                   #   Bulk classification
        summarize/                  #   Summary generation
        embed/                      #   Embedding pipeline (SSE streaming)
      auth/                         # Auth API routes
        register/                   #   Email/password registration
        profile/                    #   User profile management
        [...nextauth]/              #   NextAuth.js catch-all route
      projects/[id]/                # Project CRUD + sub-resources
        categories/                 #   Category management
        comments/                   #   Paginated comment queries
        export/                     #   CSV and metadata export
        noise/                      #   Noise filter CRUD
        structure/                  #   Report structure
        chat/                       #   RAG chat messages (GET/POST)
        embeddings/                 #   Generate/store comment embeddings
        github/                     #   GitHub repo connection + issue creation
          issues/                   #   Create issues from categories/comments
      settings/                     # LLM provider configuration
      upload/                       # CSV upload + validation
    admin/                          # Admin settings page
    login/                          # Login page
    register/                       # Registration page
    project/[id]/                   # Project pages
      upload/                       #   CSV upload UI
      structure/                    #   Report structure review
      categories/                   #   Category review + editing
      dashboard/                    #   NPS dashboard
      noise/                        #   Noise filter console
      summary/                      #   AI summary report
      chat/                         #   RAG chat analysis
      github/                       #   GitHub integration
    settings/                       # LLM settings page
    new-project/                    # Project creation form
  components/
    providers.tsx                    # SessionProvider + ThemeProvider
    ui/                             # Shared UI components (shadcn/ui)
  lib/
    ai/                             # LLM providers, prompts, encryption
    auth/                           # Auth utilities (get-user.ts)
    csv/                            # CSV validator, sampler
    db/                             # TypeORM entities, data source, connection
    nps/                            # NPS calculation logic
  auth.ts                           # NextAuth.js config (Node runtime)
  auth.config.ts                    # NextAuth.js config (Edge-compatible)
  openspec/                         # Spec-driven development artifacts
  docker-compose.yml                # SQL Server 2025 container
```

## Database Schema

| Table | Purpose |
|-------|---------|
| `projects` | Project metadata (name, description, LLM config) |
| `data_sources` | Uploaded CSV file info and validation results |
| `report_structures` | User-confirmed column selections |
| `categories` | AI-proposed or custom categories per project |
| `noise_filters` | Keyword-based noise filters with NPS exclusion |
| `comments` | Individual survey responses with AI classifications |
| `summaries` | AI-generated markdown reports |
| `llm_configs` | LLM provider settings with encrypted API keys |
| `users` | Registered user accounts (NextAuth) |
| `accounts` | OAuth provider accounts linked to users |
| `sessions` | Active user sessions |
| `github_repos` | Connected GitHub repositories per project |
| `github_issues` | Issues created from NPS data, linked to repo + project |
| `chat_messages` | RAG chat conversation history per project |

## AI Agents

| Agent | Purpose | Model Recommendation |
|-------|---------|---------------------|
| Data Validator | Analyzes CSV structure, identifies NPS/comment columns | Best available (Claude Sonnet, GPT-4o) |
| Theme Discoverer | Proposes categories from stratified comment sample | Best available |
| Classifier | Batch-classifies comments into categories | Fast/cheap (Claude Haiku, GPT-4o-mini) |
| Summary Generator | Produces markdown insight report | Best available |
| Chat Analyst (RAG) | Answers natural language questions about NPS data using retrieved comment embeddings | Best available |

## Testing

Tests use [Vitest](https://vitest.dev/) with Node.js environment.

```bash
npm test              # Run all tests once
npm run test:watch    # Run tests in watch mode
```

**Test suites (141 tests):**

| Suite | File | What it covers |
|-------|------|---------------|
| NPS Calculator | `__tests__/lib/calculator.test.ts` | Threshold constants, isPromoter/isPassive/isDetractor, NPS computation, percentages, null handling, reference dataset (NPS=18), score labels |
| CSV Validator | `__tests__/lib/validator.test.ts` | Column type detection (numeric, text), null percentage calculation, structure validation (requires numeric + text columns), sample values |
| Stratified Sampler | `__tests__/lib/sampler.test.ts` | Target size limits, empty text filtering, NPS bucket representation, null score handling |
| API Schemas | `__tests__/lib/schemas.test.ts` | Zod validation for all API inputs: project creation, LLM config, noise filters, categories, structure, UUID format |
| Encryption | `__tests__/lib/encryption.test.ts` | AES-256-GCM round-trip, random IV uniqueness, unicode support, tamper detection |
| API Error Handling | `__tests__/lib/api-error-handling.test.ts` | Invalid JSON, empty body, missing fields, wrong types, valid input pass-through, UUID validation, null body |
| AI Prompts | `__tests__/lib/prompts.test.ts` | Theme discovery (with/without hints), suggest-more (existing categories, hints), scan-for-theme (name, description, match threshold) |
| Auth Utilities | `__tests__/lib/auth.test.ts` | User resolution from session, AUTH_REQUIRED toggle, unauthenticated handling |
| GitHub Integration | `__tests__/lib/github.test.ts` | Issue creation payload, label formatting, repo connection validation |
| Chat / RAG | `__tests__/lib/chat.test.ts` | Embedding generation, cosine similarity search, chat message formatting |

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Next.js dev server (localhost:3000) |
| `npm run build` | Production build |
| `npm start` | Start production server |
| `npm run lint` | Run Next.js linter |
| `npm test` | Run all Vitest tests |
| `npm run test:watch` | Run tests in watch mode |
| `npm run db:init` | Create database and tables |
| `docker compose up -d` | Start SQL Server 2025 container |
| `docker compose down` | Stop SQL Server container |
| `docker compose down -v` | Stop and delete all data |

## Environment Variables

All variables are defined in `.env.local` (gitignored). Copy from `.env.example` to get started:

```bash
cp .env.example .env.local
# Then edit .env.local with your values
```

Next.js auto-loads `.env.local` for `npm run dev` and `npm run build`. The `npm run db:init` script loads it via `dotenv`.

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_HOST` | No | `localhost` | SQL Server host. Use `sqlserver` in Dev Containers |
| `DATABASE_PORT` | No | `1433` | SQL Server port |
| `DATABASE_USER` | No | `sa` | SQL Server username |
| `DATABASE_PASSWORD` | **Yes** | (none) | Must match `MSSQL_SA_PASSWORD` in docker-compose.yml |
| `DATABASE_NAME` | No | `nps_insight_engine` | Database name (alphanumeric, underscores, hyphens only) |
| `ENCRYPTION_KEY` | **Yes** | (none) | 64-char hex string for AES-256-GCM. Generate: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| `NODE_ENV` | No | `development` | Set to `production` to disable TypeORM synchronize and verbose logging |
| `AUTH_SECRET` | Yes (if auth enabled) | (none) | NextAuth.js secret. Generate: `npx auth secret` |
| `AUTH_REQUIRED` | No | `true` | Set to `false` to disable authentication for local development |
| `AUTH_GITHUB_ID` | No | (none) | GitHub OAuth app client ID |
| `AUTH_GITHUB_SECRET` | No | (none) | GitHub OAuth app client secret |
| `AUTH_GOOGLE_ID` | No | (none) | Google OAuth client ID |
| `AUTH_GOOGLE_SECRET` | No | (none) | Google OAuth client secret |
| `GITHUB_TOKEN` | No | (none) | GitHub personal access token for issue creation (Octokit) |

## Contributing

This project uses **spec-driven development**. Every code change must include:

1. Update the relevant OpenSpec spec in `openspec/changes/nps-insight-engine/specs/`
2. Update `README.md` if the change affects setup, usage, features, or configuration
3. Commit code + spec/doc updates together

This is enforced by Claude Code hooks (`.claude/settings.json`):
- **Pre-commit hook**: Blocks commits with code changes but no spec/doc updates
- **Post-edit hook**: Reminds to update specs after editing code files

## Development Skills

The following [Claude Code skills](https://skills.sh/) are installed to enforce best practices:

| Skill | What it enforces |
|-------|-----------------|
| `optimized-nextjs-typescript` | Next.js 15 App Router patterns, TypeScript conventions |
| `shadcn-ui` | shadcn/ui component usage and customization |
| `security-patterns` | PII protection, input sanitization, secure defaults |
| `rag-architect` | RAG architecture design, embedding strategies |
| `rag-implementation` | Vector store implementation, chunking, retrieval |
| `clean-code` | Code quality, naming, SOLID principles |
| `typescript-unit-testing` | Vitest patterns, test structure |
| `typescript-e2e-testing` | E2E testing with Playwright |
| `api-design-patterns` | REST API design, error handling, validation |

Install all skills:
```bash
npx skills add mindrally/skills@optimized-nextjs-typescript -g -y
npx skills add existential-birds/beagle@shadcn-ui -g -y
npx skills add yonatangross/orchestkit@security-patterns -g -y
npx skills add jeffallan/claude-skills@rag-architect -g -y
npx skills add sickn33/antigravity-awesome-skills@rag-implementation -g -y
npx skills add sickn33/antigravity-awesome-skills@clean-code -g -y
npx skills add bmad-labs/skills@typescript-unit-testing -g -y
npx skills add bmad-labs/skills@typescript-e2e-testing -g -y
npx skills add bobmatnyc/claude-mpm-skills@api-design-patterns -g -y
```

## SaaS Features (`nps-saas-features` branch)

### Implemented

#### UI Redesign
shadcn/ui components throughout, Lucide icons, top-nav + tabs layout (Spark app style), loading skeletons, light/dark theme toggle.

#### Authentication (NextAuth.js v5)
Full authentication system with three providers:
- **GitHub OAuth** — Sign in with GitHub account
- **Google OAuth** — Sign in with Google account
- **Email/Password** — Register and login with credentials (bcrypt-hashed passwords)

Key features:
- Registration page (`/register`) and login page (`/login`)
- Admin settings page (`/admin`) for user management
- Session-based project scoping — each user sees only their own projects
- `AUTH_REQUIRED=false` environment variable disables auth entirely for local development
- Edge-compatible config split: `auth.config.ts` (Edge middleware) and `auth.ts` (Node runtime with DB adapter)
- `SessionProvider` wraps the app via `components/providers.tsx`

#### GitHub Integration (Octokit)
Connect a GitHub repository to any project and export NPS insights as GitHub issues:
- **Connect repo** — Link a GitHub repository to a project (GitHub tab)
- **Export categories as issues** — Each NPS category becomes a GitHub issue with impact summary, representative quotes, and recommendations
- **Export selected comments** — Create issues from individual comments or filtered selections
- **Auto-label creation** — Automatically creates labels in the repo (e.g., `nps:promoter`, `nps:detractor`, category names)
- **Issue tracking** — All created issues are tracked in the GitHub tab with links back to GitHub
- Requires a `GITHUB_TOKEN` personal access token with repo scope

#### Chat Analysis (RAG)
Natural language Q&A over NPS data using retrieval-augmented generation:
- **Floating chat FAB** — A floating action button (bottom-right of the dashboard) opens an overlay chat panel; replaces the old bottom-of-page card layout
- **Enable from dashboard** — Generate embeddings for all classified comments; progress streams in real time via Server-Sent Events (SSE)
- **Smart embedding provider resolution** — `getEmbeddingConfig()` (`lib/ai/get-embedding-config.ts`) auto-finds an embedding-capable provider (OpenAI, Azure OpenAI, Ollama) even when the default LLM is Anthropic
- **Auto-pull Ollama models** — When using Ollama, the embed pipeline checks if `nomic-embed-text` is installed and auto-pulls it via the Ollama API if missing
- **Embedding providers** — OpenAI (`text-embedding-3-small`), Azure OpenAI (`text-embedding-3-small`), or Ollama (`nomic-embed-text`). Anthropic does not provide an embedding model
- **Vector storage** — Embeddings stored using SQL Server 2025 native VECTOR type
- **Cosine similarity search** — Retrieves the most relevant comments for each question
- **Cited answers** — LLM generates answers with references to specific comments
- **Chat history** — Conversations are persisted per project in the `chat_messages` table
- Access from the floating chat button on the dashboard, or the Chat tab on any project

### Planned (Not Yet Implemented)
- **AI Assistant** — Contextual helper panel on every project page
- **Cloud deployment** — Azure App Service or Vercel, migrate to Azure SQL
- **Multi-tenancy** — User/org-scoped data isolation

## OpenSpec — Spec-Driven Development Workflow

This project uses [OpenSpec](https://github.com/Fission-AI/openspec) with the `spec-driven` schema. Every feature follows a strict sequential workflow — specs are the source of truth.

### Workflow

```
Step  Artifact     Purpose                         Command
────  ──────────   ─────────────────────────────    ──────────────────────────────────────
1.    Proposal     WHY — problem, capabilities      openspec instructions proposal
2.    Specs        WHAT — requirements + scenarios   openspec instructions specs
3.    Design       HOW — architecture, decisions     openspec instructions design
4.    Tasks        DO — checklist from specs          openspec instructions tasks
5.    Apply        Execute tasks one by one           /opsx:apply
6.    Archive      Merge specs to openspec/specs/     /opsx:archive
```

**Rules:**
- Specs first, then code — never write code before the spec exists
- Tasks are derived from specs — each spec scenario becomes one or more testable tasks
- Tasks are max 4 hours each, independently testable
- Commit per task group — each commit includes spec + code + tests + docs
- Never remove spec features — mark unimplemented ones as "NOT YET IMPLEMENTED"

**Enforcement** (Claude Code hooks):
- **Pre-commit**: Blocks `git commit` if code files changed without spec/doc files staged
- **Post-edit**: Reminds to update specs after editing code files

### Active Changes

| Change | Branch | Status |
|--------|--------|--------|
| `nps-insight-engine` | `nps-insight-engine` | Complete (113/113 tasks) |
| `saas-features` | `nps-saas-features` | In progress |

### Directory Structure

```
openspec/
  config.yaml                           # Project context, schema, rules
  OPENSPEC-WORKFLOW.md                   # Full workflow guide with enforcement docs
  specs/                                # Archived specs (after /opsx:archive)
  changes/
    nps-insight-engine/                  # v1 core features (complete)
      proposal.md                       # WHY
      design.md                         # HOW
      specs/                            # WHAT (10 capability specs)
      tasks.md                          # DO (113 tasks, all done)
    saas-features/                      # SaaS features (in progress)
      proposal.md                       # WHY
      design.md                         # HOW
      specs/                            # WHAT (5 capability specs)
      tasks.md                          # DO (grouped tasks with checkboxes)
```

### For Contributors

1. Read `proposal.md` → understand WHY a change exists
2. Read `specs/` → understand WHAT the requirements are (WHEN/THEN scenarios)
3. Read `design.md` → understand HOW the architecture works
4. Read `tasks.md` → see progress (checkboxes track done/remaining)
5. Use `openspec instructions <artifact> --change "<name>"` → get creation guidelines for any artifact
6. Use `/opsx:apply` → execute tasks with progress tracking

## License

Private — not yet published.

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
Click "New Project", enter the product name and description (e.g., "MSSQL VS Code Extension").

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

You can rename, remove, or add custom categories. "General Feedback" is always present as a fallback. Click "Confirm Categories".

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

### Step 9: Export Data
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
      projects/[id]/                # Project CRUD + sub-resources
        categories/                 #   Category management
        comments/                   #   Paginated comment queries
        export/                     #   CSV and metadata export
        noise/                      #   Noise filter CRUD
        structure/                  #   Report structure
      settings/                     # LLM provider configuration
      upload/                       # CSV upload + validation
    project/[id]/                   # Project pages
      upload/                       #   CSV upload UI
      structure/                    #   Report structure review
      categories/                   #   Category review + editing
      dashboard/                    #   NPS dashboard
      noise/                        #   Noise filter console
      summary/                      #   AI summary report
    settings/                       # LLM settings page
    new-project/                    # Project creation form
  components/ui/                    # Shared UI components
  lib/
    ai/                             # LLM providers, prompts, encryption
    csv/                            # CSV validator, sampler
    db/                             # TypeORM entities, data source, connection
    nps/                            # NPS calculation logic
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

## AI Agents

| Agent | Purpose | Model Recommendation |
|-------|---------|---------------------|
| Data Validator | Analyzes CSV structure, identifies NPS/comment columns | Best available (Claude Sonnet, GPT-4o) |
| Theme Discoverer | Proposes categories from stratified comment sample | Best available |
| Classifier | Batch-classifies comments into categories | Fast/cheap (Claude Haiku, GPT-4o-mini) |
| Summary Generator | Produces markdown insight report | Best available |

## Testing

Tests use [Vitest](https://vitest.dev/) with Node.js environment.

```bash
npm test              # Run all tests once
npm run test:watch    # Run tests in watch mode
```

**Test suites (67 tests):**

| Suite | File | What it covers |
|-------|------|---------------|
| NPS Calculator | `__tests__/lib/calculator.test.ts` | Threshold constants, isPromoter/isPassive/isDetractor, NPS computation, percentages, null handling, reference dataset (NPS=18), score labels |
| CSV Validator | `__tests__/lib/validator.test.ts` | Column type detection (numeric, text), null percentage calculation, structure validation (requires numeric + text columns), sample values |
| Stratified Sampler | `__tests__/lib/sampler.test.ts` | Target size limits, empty text filtering, NPS bucket representation, null score handling |
| API Schemas | `__tests__/lib/schemas.test.ts` | Zod validation for all API inputs: project creation, LLM config, noise filters, categories, structure, UUID format |
| Encryption | `__tests__/lib/encryption.test.ts` | AES-256-GCM round-trip, random IV uniqueness, unicode support, tamper detection |
| API Error Handling | `__tests__/lib/api-error-handling.test.ts` | Invalid JSON, empty body, missing fields, wrong types, valid input pass-through, UUID validation, null body |

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

## Contributing

This project uses **spec-driven development**. Every code change must include:

1. Update the relevant OpenSpec spec in `openspec/changes/nps-insight-engine/specs/`
2. Update `README.md` if the change affects setup, usage, features, or configuration
3. Commit code + spec/doc updates together

This is enforced by Claude Code hooks (`.claude/settings.json`):
- **Pre-commit hook**: Blocks commits with code changes but no spec/doc updates
- **Post-edit hook**: Reminds to update specs after editing code files

## Deferred Features (SaaS Phase)

- **Authentication** — NextAuth.js v5 with GitHub, Google, email/password
- **Cloud deployment** — Azure App Service or Vercel, migrate to Azure SQL
- **Vector/RAG** — Semantic search using SQL Server 2025 native VECTOR type
- **Multi-tenancy** — User/org-scoped data isolation
- **Metadata import** — Upload previously exported JSON to pre-configure new projects

## OpenSpec

This project uses [OpenSpec](https://github.com/Fission-AI/openspec) for spec-driven development. See `openspec/OPENSPEC-WORKFLOW.md` for the full workflow guide, and `openspec/changes/nps-insight-engine/` for all spec artifacts (proposal, design, specs, tasks).

## License

Private — not yet published.

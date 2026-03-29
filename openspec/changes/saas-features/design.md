---

## Context

The NPS Insight Engine is a local-first, AI-powered NPS analysis platform built with Next.js 15, TypeORM, and SQL Server 2025. The current v1 provides a complete analysis workflow — CSV upload, AI-driven theme discovery and classification, interactive dashboard with noise filtering, and AI-generated summary reports. However, insights stop at the dashboard. Users cannot conversationally query their data, cannot turn feedback themes into actionable work items, and have no contextual guidance through the workflow. There is also no authentication, making multi-user or cloud deployment impossible.

SQL Server 2025's native VECTOR data type and TypeORM's vector column support were chosen in v1 specifically to enable RAG-based features in this phase. The Vercel AI SDK's multi-provider abstraction and the encrypted API key storage pattern are reused and extended across all new AI features.

No open-source tool combines AI-powered NPS analysis with RAG chat, feedback-to-GitHub-Issues automation, or contextual AI assistants. Commercial alternatives (Enterpret, Unwrap) charge enterprise pricing and lack GitHub integration. These features position NPS Insight Engine in an uncontested niche for PMs who live in GitHub-centric workflows.

## Goals / Non-Goals

**Goals:**
- Enable natural language Q&A over NPS comments using RAG with SQL Server 2025 vector similarity search
- Automate GitHub issue creation from feedback categories and individual comments with templated formatting, labels, and NPS impact scores
- Provide a contextual AI assistant panel on every project page that gives step-aware guidance and recommendations
- Add authentication via NextAuth.js v5 with GitHub, Google, and email/password providers so projects are user-scoped
- Track all GitHub issues created from the platform with status and links

**Non-Goals:**
- Billing, payments, or subscription management
- Multi-tenancy with organizations or team workspaces
- Real-time collaboration or multiplayer editing
- Webhook-based feedback ingestion or survey platform integrations
- Fine-tuning or training custom embedding models
- GitHub issue sync (pull status updates back from GitHub automatically)

## Decisions

### 0. UI Redesign — shadcn/ui

The current UI uses raw Tailwind utilities for all components. While functional, it lacks the polish of modern SaaS apps (no proper modals, no toast notifications, inconsistent card styling, no icons, browser `confirm()` for deletions).

**Component library:** shadcn/ui — the de facto standard for Next.js + Tailwind projects. It provides copy-paste, customizable components (not a black-box library). Components are installed into `components/ui/` and fully owned by the project.

**Icons:** Lucide React — the icon library that ships with shadcn/ui. Consistent, clean, extensive.

**Theme:** next-themes for light/dark mode toggle with persistent preference. shadcn/ui components automatically adapt to both themes via CSS variables.

**Style variant:** "new-york" (shadcn's more refined variant) with slate color scale.

**Key components to adopt:** Button, Card, Input, Label, Select, Textarea, Checkbox, Badge, Dialog, AlertDialog, Tabs, Progress, Toast (Sonner), DropdownMenu, Separator, Tooltip, Avatar, Sheet, Skeleton.

**Migration approach:** Incremental — replace raw HTML elements page by page. shadcn/ui components coexist with existing Tailwind utilities during migration.

**UI reference:** The "Log Analyzer" app (built with GitHub Copilot SDK) demonstrates the UX patterns we're targeting: multi-stage progress bars with step labels ("Analyzing 30%", "Aggregating 75%"), tab-based results (Overview, Findings, GitHub Issues), GitHub issue cards with open/closed status badges, and a "Powered by" badge. These patterns map directly to shadcn/ui components (Progress, Tabs, Badge, Card).

**Alternatives considered:**
- **Radix UI directly:** shadcn/ui is built on Radix — using shadcn gives us pre-styled Radix components
- **Material UI:** Heavy bundle, different design language, not idiomatic for Tailwind projects
- **Headless UI:** Fewer components, less maintained than Radix/shadcn
- **Chakra UI:** Brings its own styling system that conflicts with Tailwind

### Development Skills

The following Claude Code skills are installed globally to enforce best practices:

| Skill | Purpose |
|-------|---------|
| `optimized-nextjs-typescript` | Next.js 15 + TypeScript patterns, App Router conventions |
| `shadcn-ui` | shadcn/ui component usage, proper installation and customization |
| `security-patterns` | Security best practices, PII protection, input sanitization |
| `rag-architect` | RAG architecture design, embedding strategies, retrieval patterns |
| `rag-implementation` | Hands-on RAG implementation, vector stores, chunking strategies |
| `clean-code` | Code quality, naming, structure, SOLID principles |
| `typescript-unit-testing` | TypeScript unit test patterns with Vitest |
| `typescript-e2e-testing` | E2E testing with Playwright |
| `api-design-patterns` | REST API design, error handling, validation conventions |

### 1. RAG Chat Architecture

Comments are embedded at the user's request ("Enable Chat Analysis") rather than automatically after classification. This avoids unnecessary embedding costs for users who only need the dashboard.

**Embedding model choice:** The system reuses the user's configured LLM provider where possible, with a fallback strategy:
- **OpenAI:** `text-embedding-3-small` (1536 dimensions) — best cost/quality ratio for this use case
- **Azure OpenAI:** Same model deployed on the user's Azure endpoint
- **Ollama:** `ollama/embeddings` endpoint with the user's chosen model (e.g., `nomic-embed-text` at 768 dimensions, `mxbai-embed-large` at 1024)
- **Anthropic:** Anthropic does not offer an embeddings API. When the user's LLM provider is Anthropic, the system prompts them to configure a secondary embedding provider — either an OpenAI API key for `text-embedding-3-small` or a local Ollama instance. This is surfaced in the Chat Analysis setup flow, not in global settings.

**Vector storage:** SQL Server 2025 `VECTOR(n)` column added to the `comments` table via TypeORM `@Column("vector", { length: 1536 })`. The dimension length is stored per-project in the `projects` table (`embeddingDimensions: number`) since Ollama models vary. For projects using OpenAI embeddings (1536d), the column is created at 1536. For Ollama models with different dimensions, the column length matches the model output. All comments in a single project use the same embedding model and dimension.

**Retrieval:** `VECTOR_DISTANCE('cosine', comment.embedding, @queryEmbedding)` for similarity search. Top-K results (default K=10) retrieved, filtered by any active noise filters, then injected as context into the LLM prompt.

**Chat flow:**
1. User types a question in the chat panel
2. Question is embedded using the same model that embedded the comments
3. Top-K similar comments retrieved via `VECTOR_DISTANCE`
4. Retrieved comments (with their NPS score, category, and metadata) injected as context into the LLM prompt
5. LLM generates an answer with inline citations referencing specific comments
6. Chat messages (user + assistant) persisted in `chat_messages` table for conversation history

**Alternatives considered:**
- **Embed on classification:** Adds latency and cost to the classification step for a feature not all users need
- **External vector DB (Pinecone, Weaviate):** Adds infrastructure complexity; SQL Server 2025 VECTOR is sufficient and keeps the stack simple
- **Full-text search instead of vector search:** Misses semantic similarity (e.g., "database performance" matching "queries are slow")

### 2. GitHub Integration

**Library choice:** Octokit (`@octokit/rest`) for GitHub API access. Octokit is the official GitHub SDK, well-maintained, and typed. The Copilot SDK is not used — it targets Copilot extension development, not GitHub API operations.

**Authentication:** Users provide a GitHub personal access token (PAT) with `repo` scope. The PAT is encrypted using the same AES-256-GCM pattern as LLM API keys and stored in a `github_configs` table linked to the project. One GitHub config per project (repo owner, repo name, encrypted PAT).

**Issue template:** Each created issue uses a markdown template containing:
- Title: `[NPS Feedback] {Category Name}` or `[NPS Feedback] {Comment excerpt}`
- Body sections: NPS Impact (score delta if this category were resolved), Category Summary (comment count, sentiment breakdown), Representative Quotes (top 3-5 comments by confidence), and Suggested Actions (AI-generated from the summary agent)
- Labels: `nps-feedback`, category name (slugified), and sentiment label (`promoter`, `passive`, `detractor`). Labels are auto-created via the API if they don't exist on the target repo.

**Issue tracking:** Created issues are recorded in a `github_issues` table with the GitHub issue number, URL, title, category link, and creation timestamp. A "GitHub Issues" tab in the project sidebar shows all created issues with links.

**Alternatives considered:**
- **GitHub App instead of PAT:** Better for multi-user SaaS but requires OAuth flow and app registration — overkill for local-first tool
- **Linear/Jira integration:** GitHub is the priority given the target audience (PMs in GitHub-centric workflows); other integrations deferred

### 3. AI Assistant

**UI:** A floating, collapsible chat panel component (`components/ui/AssistantPanel.tsx`) rendered in the project layout (`app/project/[id]/layout.tsx`). Toggled via a fixed button in the bottom-right corner. The panel slides in from the right and does not obstruct the main content.

**Context injection:** On each message, the assistant receives:
- Current page identifier (upload, structure, categories, dashboard, noise, summary)
- Project metadata (name, description, total comments, NPS score)
- Current step's relevant data (e.g., on the categories page: category list with counts; on the dashboard: active filters and score breakdown)
- No conversation history beyond the current session (stateless between page loads to keep prompts small)

**LLM provider:** Uses the same provider and model configured for other agents. No separate configuration needed.

**No RAG:** The assistant does not perform vector search. It receives pre-assembled context about the current page state. This keeps it lightweight and fast — under 1 second response time for most queries. Users who need to search across comments use the dedicated Chat Analysis feature instead.

**Alternatives considered:**
- **RAG-powered assistant:** Adds complexity and latency for a feature meant to provide quick contextual help
- **Separate assistant model config:** Adds configuration burden; the existing provider works fine
- **Persistent conversation history:** Increases prompt size and cost without proportional benefit for a step-aware helper

### 4. Authentication

**Framework:** NextAuth.js v5 (`next-auth@5`) with the App Router integration. NextAuth v5 is the latest version with native Next.js 15 support, edge-compatible session handling, and TypeORM adapter.

**Providers (in priority order):**
1. **GitHub OAuth:** Primary provider — aligns with the GitHub integration feature and target audience
2. **Google OAuth:** Secondary provider for users outside GitHub ecosystems
3. **Credentials (email/password):** Fallback for local development and users who prefer not to use OAuth. Passwords hashed with bcrypt.

**Session storage:** Database-backed sessions via the TypeORM adapter (`@auth/typeorm-adapter`). Session data stored in SQL Server, not JWT-only. This enables server-side session revocation and avoids JWT size limits.

**Route protection:** Next.js middleware (`middleware.ts`) checks for a valid session on all routes except `/api/auth/*`, `/login`, and static assets. Unauthenticated requests redirect to `/login`. API routes validate the session via `auth()` from `next-auth`.

**User scoping:** Projects are linked to users via a `userId` foreign key on the `projects` table. All project queries filter by the authenticated user's ID. The settings page (LLM keys) is also user-scoped.

**Alternatives considered:**
- **Clerk/Auth0:** Managed auth services add external dependencies and cost; NextAuth keeps everything self-hosted
- **JWT-only sessions:** Simpler but cannot revoke sessions server-side; database sessions are more secure
- **Lucia Auth:** Lighter weight but less ecosystem support than NextAuth for the TypeORM + SQL Server stack

## Risks / Trade-offs

**[Embedding provider mismatch with Anthropic]** → Anthropic users must configure a secondary provider for embeddings, adding friction to the Chat Analysis setup. Mitigation: Clear setup flow that detects the Anthropic provider and prompts for embedding configuration before proceeding. Consider defaulting to Ollama if detected locally.

**[Vector dimension variability across Ollama models]** → Different Ollama embedding models produce different dimensions (768, 1024, etc.). A project's embedding dimension is locked once Chat Analysis is enabled. Mitigation: Store dimension per project; warn users that changing the embedding model requires re-embedding all comments.

**[GitHub PAT scope and expiration]** → PATs can expire or be revoked, breaking issue creation. Fine-grained PATs have complex permission models. Mitigation: Test PAT validity on save, show clear error when a PAT is expired, document required scopes.

**[Chat latency for large projects]** → Vector search over 10,000+ comments may be slow without indexing. SQL Server 2025 supports `VECTOR INDEX` but TypeORM does not generate it. Mitigation: Use raw SQL for index creation in the db:init script; default top-K of 10 limits result set size.

**[NextAuth TypeORM adapter maturity]** → The `@auth/typeorm-adapter` for SQL Server is less battle-tested than the Prisma adapter. Mitigation: Pin adapter version, test auth flows thoroughly, keep manual migration scripts as backup.

**[Authentication retrofit complexity]** → Adding auth to an existing codebase requires updating every API route and page. Mitigation: Middleware handles route protection centrally; API routes add a single `auth()` check. Feature flag to disable auth for local development (`AUTH_REQUIRED=false` env var).

**[Increased infrastructure requirements]** → GitHub OAuth requires registering a GitHub App or OAuth App with callback URLs. Google OAuth requires GCP console configuration. Mitigation: Document setup steps clearly; credentials provider works without any external registration for local dev.

## Database Schema Additions

### New Tables

**`users`** (managed by NextAuth TypeORM adapter)
| Column | Type | Notes |
|--------|------|-------|
| id | varchar(255) PK | NextAuth user ID |
| name | varchar(255) | Display name |
| email | varchar(255) UNIQUE | Email address |
| emailVerified | datetime | Email verification timestamp |
| image | varchar(255) | Avatar URL |
| password | varchar(255) NULL | Bcrypt hash (credentials provider only) |

**`accounts`** (managed by NextAuth TypeORM adapter)
| Column | Type | Notes |
|--------|------|-------|
| id | varchar(255) PK | |
| userId | varchar(255) FK → users | |
| type | varchar(255) | oauth, credentials |
| provider | varchar(255) | github, google, credentials |
| providerAccountId | varchar(255) | |
| access_token | text NULL | OAuth access token |
| refresh_token | text NULL | OAuth refresh token |
| expires_at | int NULL | Token expiry |

**`sessions`** (managed by NextAuth TypeORM adapter)
| Column | Type | Notes |
|--------|------|-------|
| id | varchar(255) PK | |
| sessionToken | varchar(255) UNIQUE | |
| userId | varchar(255) FK → users | |
| expires | datetime | Session expiry |

**`chat_messages`**
| Column | Type | Notes |
|--------|------|-------|
| id | int PK AUTO | |
| projectId | int FK → projects | |
| role | varchar(20) | "user" or "assistant" |
| content | nvarchar(max) | Message text |
| citations | nvarchar(max) NULL | JSON array of comment IDs referenced |
| createdAt | datetime | |

**`github_configs`**
| Column | Type | Notes |
|--------|------|-------|
| id | int PK AUTO | |
| projectId | int FK → projects UNIQUE | One config per project |
| repoOwner | varchar(255) | GitHub org or user |
| repoName | varchar(255) | Repository name |
| encryptedPat | nvarchar(max) | AES-256-GCM encrypted PAT |
| patIv | varchar(255) | Initialization vector |
| patAuthTag | varchar(255) | Auth tag |
| createdAt | datetime | |
| updatedAt | datetime | |

**`github_issues`**
| Column | Type | Notes |
|--------|------|-------|
| id | int PK AUTO | |
| projectId | int FK → projects | |
| categoryId | int FK → categories NULL | NULL if created from a single comment |
| commentId | int FK → comments NULL | NULL if created from a category |
| githubIssueNumber | int | Issue number on the repo |
| githubUrl | varchar(500) | Full URL to the issue |
| title | varchar(500) | Issue title |
| labels | nvarchar(max) | JSON array of label strings |
| createdAt | datetime | |

### Column Additions to Existing Tables

**`projects`** — add columns:
| Column | Type | Notes |
|--------|------|-------|
| userId | varchar(255) FK → users NULL | NULL for pre-auth projects (migration) |
| embeddingProvider | varchar(50) NULL | "openai", "azure", "ollama" |
| embeddingModel | varchar(255) NULL | e.g., "text-embedding-3-small" |
| embeddingDimensions | int NULL | 1536, 768, 1024, etc. |
| chatEnabled | bit DEFAULT 0 | Whether embeddings have been generated |

**`comments`** — add column:
| Column | Type | Notes |
|--------|------|-------|
| embedding | vector(1536) NULL | Vector embedding; actual dimension set per project |

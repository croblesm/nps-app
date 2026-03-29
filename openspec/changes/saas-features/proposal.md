## Why

The NPS Insight Engine provides a complete analysis workflow but insights stop at the dashboard. Users can't conversationally query their data, can't turn feedback into actionable GitHub issues, and have no contextual guidance through the workflow. These gaps prevent the tool from being used in a real PM workflow where insights must lead to action. Additionally, authentication is needed before any multi-user or cloud deployment.

No open-source tool combines AI-powered NPS analysis with RAG chat, feedback-to-GitHub-Issues automation, or contextual AI assistants. Commercial tools (Enterpret, Unwrap) charge enterprise pricing. This positions NPS Insight Engine in an uncontested niche.

## What Changes

- **New**: Chat-based analysis (RAG) — embed comments using SQL Server 2025 VECTOR type, enable natural language Q&A over NPS data via vector similarity search
- **New**: GitHub issue creation — configure a repo, export category themes or individual comments as GitHub issues with templates, labels, and NPS impact scores
- **New**: Contextual AI assistant — collapsible chat panel on every page that knows the user's current step and can answer questions or make recommendations
- **New**: Authentication — NextAuth.js v5 with GitHub (priority), Google, and email/password providers; user-scoped projects; admin settings page
- **New**: GitHub Issues tracker — view all issues created from the project with status

## Non-Goals

- Billing/payments
- Multi-tenancy with organizations
- Real-time collaboration
- Webhook-based feedback ingestion
- Direct integration with survey platforms (CSV upload only)

## User Flow

1. **Auth** → User signs in via GitHub/Google/email → sees their projects
2. **Dashboard** → After classification, click "Enable Chat Analysis" → embeddings generated → chat panel appears
3. **Chat** → "What are DBAs complaining about?" → RAG retrieves relevant comments → LLM answers with citations
4. **GitHub Export** → Click category card → "Export to GitHub" → issue created with template, labels, quotes
5. **Assistant** → Collapsible panel on any page → "Help me understand this NPS score" → contextual guidance
6. **Admin** → Settings → change display name, manage connected accounts

## Capabilities

### New Capabilities
- `chat-analysis`: RAG-based Q&A over NPS comments using SQL Server 2025 VECTOR type and vector similarity search
- `github-integration`: Configure GitHub repos, create issues from categories/comments, track created issues
- `ai-assistant`: Contextual AI chat panel available on all project pages with step-aware recommendations
- `authentication`: NextAuth.js v5 with GitHub/Google/credentials, user-scoped projects, admin settings

### Modified Capabilities
- `nps-dashboard`: Add "Enable Chat Analysis" button, chat panel, and GitHub export actions on category cards
- `project-management`: Projects scoped to authenticated user; GitHub repo configuration in project settings

## Impact

- **Dependencies**: Add `@octokit/rest`, `next-auth`, `@auth/core`
- **Database**: Add `embedding` VECTOR column to comments table, `users` table, `chat_messages` table, `github_issues` table, `github_configs` table
- **Auth**: All routes protected by middleware; API routes require session
- **Infrastructure**: GitHub OAuth app registration required for GitHub provider

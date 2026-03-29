## 0. UI Redesign — shadcn/ui Migration

- [x] 0.1 Initialize shadcn/ui: npx shadcn@latest init (new-york style, slate color, CSS variables)
- [x] 0.2 Install core shadcn/ui components: button, card, input, label, select, textarea, checkbox, badge, dialog, alert-dialog, tabs, progress, toast, dropdown-menu, separator, tooltip, avatar, sheet
- [x] 0.3 Install lucide-react for icons
- [x] 0.4 Add theme provider with next-themes for light/dark toggle, persist preference
- [x] 0.5 Add theme toggle button to Header component (sun/moon icon)
- [x] 0.6 Redesign Header: use shadcn Button, Avatar, DropdownMenu for settings/user menu
- [x] 0.7 Redesign project sidebar: add Lucide icons to each step, use shadcn navigation patterns
- [x] 0.8 Redesign home page: project list as shadcn Cards with proper typography, hover effects, delete via AlertDialog
- [x] 0.9 Redesign new project form: shadcn Input, Textarea, Label, Button components
- [x] 0.10 Redesign settings page: shadcn Select, Input, Card, Badge for configured providers
- [x] 0.11 Redesign upload page: polished drag-and-drop zone with shadcn Card, Progress bar for upload
- [x] 0.12 Redesign structure review: shadcn Cards with Checkbox, Badge for column types
- [x] 0.13 Redesign categories page: shadcn Cards with Badge for sample counts, Dialog for AI scan results
- [x] 0.14 Redesign dashboard: shadcn Cards for score cards, Badge for sentiment, Tabs for sub-views
- [x] 0.15 Redesign noise filters: pill/tag input for keywords (Badge with X button), AlertDialog for delete
- [x] 0.16 Redesign summary page: proper markdown container, shadcn Button for actions
- [x] 0.17 Replace all browser confirm() with shadcn AlertDialog
- [x] 0.18 Replace all inline success/error messages with shadcn Toast (Sonner)
- [x] 0.19 Add loading skeletons using shadcn Skeleton component for page load states
- [x] 0.20 Verify light mode and dark mode look polished on all pages
- [x] 0.21 Write tests for theme toggle, verify component rendering
- [x] 0.22 Update specs, README, CLAUDE.md with shadcn/ui documentation
- [x] 0.23 Phase 1: Fix dark mode palette (neutral grays), add NPS semantic tokens, fix markdown hex colors in globals.css
- [x] 0.24 Phase 2: Fix core components (Spinner, SearchBar, FilterPanel, Header, ScoreCards, CategoryBreakdown, DataTable)
- [x] 0.25 Phase 3: Fix pages (categories, dashboard, structure, layout)
- [x] 0.26 Phase 4: Fix secondary files (ChatPanel, github, summary, settings, error, upload)
- [x] 0.27 Verify zero hardcoded color classes remain

### 0b. Sidebar Layout + Charts Redesign

- [x] 0.28 Install dependencies: `npx shadcn@latest add sidebar breadcrumb collapsible` + `npm install recharts`. Verify: components/ui/sidebar.tsx exists, recharts in package.json
- [x] 0.29 Create `components/app-sidebar.tsx` — two modes: home (Projects, Settings) and project (Dashboard, Data, Categories, Noise, Summary, GitHub). Uses usePathname + useParams to detect context. Verify: renders in isolation
- [x] 0.30 Create `components/top-bar.tsx` — minimal h-12 bar with SidebarTrigger, Breadcrumb, LLM status badge, theme toggle. Verify: renders in isolation
- [x] 0.31 Add sidebar user footer — avatar, name, email from useSession, DropdownMenu with Account Settings + Sign Out. Verify: sign-out works
- [x] 0.32 Update `app/layout.tsx` — replace Header with SidebarProvider + AppSidebar + SidebarInset + TopBar. Verify: home page renders with sidebar
- [x] 0.33 Simplify `app/project/[id]/layout.tsx` — remove project header + tab navigation (sidebar handles it). Keep AssistantContextProvider + content wrapper. Verify: all 6 project pages still load
- [x] 0.34 Delete `components/ui/Header.tsx` (replaced by TopBar + sidebar). Move LLM status logic to top-bar.tsx. Verify: build passes
- [ ] 0.35 Refactor AssistantPanel from floating panel to sidebar-integrated. Sheet trigger in sidebar footer. Verify: assistant opens from sidebar
- [ ] 0.36 Upload page: detect existing data on mount, show success card + "Replace Data" button. Hide upload zone when data exists. Verify: shows correct state for existing project
- [ ] 0.37 Categories page: add visible Pencil icon next to each category name (always visible). Verify: pencil shows without hover
- [ ] 0.38 Categories page: move "Suggest More" + "AI Scan" to toolbar row at top. Move custom category form into Dialog. Verify: actions accessible at top of page
- [ ] 0.39 Noise filters: add edit icon → Dialog for existing filters. Add PATCH handler to noise API route. Verify: can edit name/keywords of existing filter
- [ ] 0.40 Noise filters: show match count badge per filter. Verify: count displays next to filter name
- [ ] 0.41 GitHub page: add Tabs component ("Configuration" | "Created Issues (N)"). Verify: tabs switch between config and issues
- [ ] 0.42 Summary page: add NpsVisualCards component with recharts PieChart (promoter/passive/detractor donut). Fetch stats on mount. Verify: chart renders above markdown
- [ ] 0.43 Dashboard: add NpsDonutChart component (recharts PieChart with NPS score center label). Verify: chart renders between score cards and category breakdown
- [ ] 0.44 Dashboard: add CategoryBarChart component (recharts horizontal BarChart). Clicking bar filters dashboard. Verify: bar click triggers category filter
- [ ] 0.45 Dashboard: add subtle gradient to active score cards (from-primary/5 to-card). Replace emoji with clean label. Verify: visual improvement
- [ ] 0.46 Polish: remove max-w-7xl constraints, consistent p-4 md:p-6 spacing, breadcrumb context. Verify: all pages look clean
- [ ] 0.47 Update specs, README, CLAUDE.md with sidebar layout + charts documentation. Update test counts.

## 1. Authentication Foundation

- [x] 1.1 Install next-auth@5, @auth/typeorm-adapter, bcryptjs
- [x] 1.2 Create User entity (lib/db/entities/User.ts) with name, email, password, image fields
- [x] 1.3 Create NextAuth config — split into Edge-compatible lib/auth/config.ts (callbacks only, no Node imports) and lib/auth/index.ts (GitHub, Google, Credentials providers with bcryptjs lookup)
- [x] 1.4 Create auth API route (app/api/auth/[...nextauth]/route.ts)
- [x] 1.5 Create login page (app/login/page.tsx) with provider buttons and email/password form
- [x] 1.6 Create middleware.ts for route protection (exclude /login, /api/auth, static assets)
- [x] 1.7 Add userId FK to Project entity, update project CRUD to scope by authenticated user via getCurrentUserId() helper (lib/auth/get-user.ts)
- [x] 1.8 Create admin settings page (app/admin/page.tsx) with profile name update, connected accounts display, and password change form (calls PATCH /api/auth/profile)
- [x] 1.9 Add AUTH_REQUIRED env var to disable auth for local development
- [x] 1.10 Write tests for auth schemas (register Zod validation, profile update schema), middleware logic (authorized callback), user scoping (getCurrentUserId)
- [x] 1.11 Update specs, README, CLAUDE.md with auth documentation
- [x] 1.12 Add provider/providerAccountId fields to User entity for OAuth tracking
- [x] 1.13 Implement OAuth user creation with profile callbacks (create/update User on GitHub/Google sign-in)
- [x] 1.14 Implement OAuth account linking (same email across GitHub + Google → single user)
- [x] 1.15 Accurate connected accounts detection in admin page (query DB instead of session heuristics)
- [x] 1.16 Add sign-out dropdown menu in header (user name, email, sign-out button)

## 2. GitHub Integration

- [x] 2.1 Install @octokit/rest
- [x] 2.2 Create GitHubConfig entity (lib/db/entities/GitHubConfig.ts) with repoOwner, repoName, encryptedPat
- [x] 2.3 Create GitHubIssue entity (lib/db/entities/GitHubIssue.ts) with issueNumber, url, title, labels
- [x] 2.4 Create GitHub repo config page in project settings (app/project/[id]/github/page.tsx)
- [x] 2.5 Create API route to save/validate GitHub config (app/api/projects/[id]/github/route.ts) — validates PAT by calling repos endpoint
- [x] 2.6 Create issue template builder (lib/github/issue-template.ts) — markdown template with NPS impact, quotes, recommendations
- [x] 2.7 Create API route to export category as GitHub issue (app/api/projects/[id]/github/issues/route.ts)
- [x] 2.8 Add "Export to GitHub" action on category breakdown cards (components/nps/CategoryBreakdown.tsx) — githubEnabled prop controls visibility, dashboard wires handleExportCategory callback
- [x] 2.9 Add comment selection + batch export to GitHub from data table (DataTable.tsx) — checkbox column, selected state Set, selection toolbar with export/clear buttons, dashboard wires handleExportSelected
- [x] 2.10 Create GitHub Issues tracker tab (app/project/[id]/github/page.tsx) showing created issues with status
- [x] 2.11 Add "GitHub" step to project sidebar navigation
- [x] 2.12 Write tests for issue template builder (markdown output, NPS impact section), GitHub config schema validation (owner, repo, PAT fields)
- [x] 2.13 Update specs, README with GitHub integration documentation
- [x] 2.14 Add issue status tracking (open/closed) — status field in GitHubIssue entity, refresh from GitHub API
- [x] 2.15 Add empty state message on GitHub page when no issues created
- [x] 2.16 Add LLM-based bug/feature-request labels on issue creation
- [x] 2.17 Per-category batch export — create one issue per category when selecting across categories
- [x] 2.18 Deep link in issue footer — link back to project dashboard with category/comment query params

## 3. RAG Chat Analysis

- [x] 3.1 Add embedding column to Comment entity: @Column("vector", { length: 1536, nullable: true })
- [x] 3.2 Add embeddingProvider, embeddingModel, embeddingDimensions, chatEnabled columns to Project entity
- [x] 3.3 Create embedding provider abstraction (lib/ai/embeddings.ts) — supports OpenAI, Azure, Ollama embedding endpoints
- [x] 3.4 Create API route for embedding pipeline (app/api/ai/embed/route.ts) — batch embed comments with progress
- [x] 3.5 Create API route for chat (app/api/ai/chat/route.ts) — embed question, vector search, LLM answer with citations
- [x] 3.6 Create ChatMessage entity (lib/db/entities/ChatMessage.ts)
- [x] 3.7 Build "Enable Chat Analysis" button on dashboard with embedding progress UI
- [x] 3.8 Build chat panel component (components/nps/ChatPanel.tsx) — input, message history, cited comments
- [x] 3.9 Handle Anthropic provider detection — returns clear 400 error in both embed and chat API routes when provider is "anthropic", guiding user to configure OpenAI/Azure/Ollama
- [x] 3.10 Create API route to get chat history (app/api/projects/[id]/chat/route.ts)
- [x] 3.11 Write tests for embedding provider abstraction (embedBatch, embedText, provider detection), chat message schemas (Zod validation)
- [x] 3.12 Update specs, README with chat analysis documentation
- [x] 3.13 Smart embedding provider resolution (lib/ai/get-embedding-config.ts) — auto-find embedding-capable provider, add EMBEDDING_CAPABLE_PROVIDERS constant
- [x] 3.14 Update embed and chat routes to use getEmbeddingConfig() instead of hardcoded default lookup
- [x] 3.15 Replace bottom Chat Analysis card with floating action button + overlay ChatPanel
- [x] 3.16 Add onClose prop to ChatPanel for overlay dismissal
- [x] 3.17 Write tests for getEmbeddingConfig logic
- [x] 3.18 Update specs, README, CLAUDE.md with smart provider resolution and floating chat docs
- [x] 3.19 Apply active dashboard filters (category, score, search) to chat similarity search
- [x] 3.20 Make K (top results count) configurable, default to 20 instead of 10
- [ ] 3.21 Migrate similarity search to SQL Server 2025 VECTOR_DISTANCE function
- [x] 3.22 Add resume UI for partially generated embeddings
- [x] 3.23 Make citations clickable — scroll to referenced comment in data table
- [x] 3.24 Handle "no relevant comments" — detect low similarity scores, return guidance instead of empty-context LLM response

## 4. Contextual AI Assistant

### 4a. Core Components
- [x] 4.1 Create AssistantPanel component (components/ui/AssistantPanel.tsx) — floating button + expandable right-side panel with text input, scrollable messages, collapse toggle. Verify: renders in isolation, expand/collapse works
- [x] 4.2 Create assistant API route (app/api/ai/assistant/route.ts) — accepts projectId, page, message, pageContext object. Uses getActiveModel() + generateText(). Returns response text. Verify: returns 400 if no LLM configured with link to settings
- [x] 4.3 Create assistant prompt builder (lib/ai/assistant-prompts.ts) — buildAssistantSystemPrompt(page, context) returns a system prompt with page name, project metadata, and page-specific data injected. Verify: unit test for each page type

### 4b. Layout Integration
- [x] 4.4 Add AssistantPanel to project layout (app/project/[id]/layout.tsx) — render below children, pass current page name via usePathname(). Verify: panel visible on all 6 project pages
- [x] 4.5 Persist assistant open/closed state across page navigation — use React state in layout (not per-page). Verify: open panel, navigate to another tab, panel stays open

### 4c. Page Context Collection
- [x] 4.6 Upload page context — pass upload status (no file / file uploaded / structure confirmed) to assistant. Verify: assistant responds with CSV format guidance
- [x] 4.7 Structure page context — pass column list with included/excluded status. Verify: assistant responds with column selection advice
- [x] 4.8 Categories page context — pass discovered category names, counts, sample comments. Verify: assistant responds with category-specific advice
- [x] 4.9 Dashboard page context — pass NPS score, score distribution, category breakdown, active filters. Verify: assistant responds with data analysis
- [x] 4.10 Noise filters page context — pass active filters, excluded comment count. Verify: assistant suggests filters for common noise patterns
- [x] 4.11 Summary page context — pass whether summary has been generated. Verify: assistant explains summary features

### 4d. Proactive Recommendations
- [x] 4.12 Detect unfiltered noise patterns (e.g., "N/A", "test", single-word comments) and suggest noise filters when user opens assistant on noise page. Verify: recommendation appears in response
- [x] 4.13 Detect high detractor categories on dashboard and suggest investigation. Verify: recommendation includes category name and detractor count

### 4e. Tests and Documentation
- [x] 4.14 Write unit tests for buildAssistantSystemPrompt — test each page context type (upload, structure, categories, dashboard, noise, summary). Verify: npm test passes
- [x] 4.15 Update specs/ai-assistant/spec.md with implementation details. Update README and CLAUDE.md with assistant documentation. Verify: specs match code

## 5. Integration and Polish

- [ ] 5.1 End-to-end test: login → create project → full workflow → chat analysis → export to GitHub
- [ ] 5.2 Update all OpenSpec specs with final implementation details
- [ ] 5.3 Update README with complete SaaS features documentation
- [ ] 5.4 Update CLAUDE.md with new architecture, commands, and conventions
- [ ] 5.5 Verify: clean clone → docker compose up → npm install → npm run dev → full workflow

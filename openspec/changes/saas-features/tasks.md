## 0. UI Redesign — shadcn/ui Migration

- [x] 0.1 Initialize shadcn/ui: npx shadcn@latest init (new-york style, slate color, CSS variables)
- [x] 0.2 Install core shadcn/ui components: button, card, input, label, select, textarea, checkbox, badge, dialog, alert-dialog, tabs, progress, toast, dropdown-menu, separator, tooltip, avatar, sheet
- [x] 0.3 Install lucide-react for icons
- [x] 0.4 Add theme provider with next-themes for light/dark toggle, persist preference
- [x] 0.5 Add theme toggle button to Header component (sun/moon icon)
- [x] 0.6 Redesign Header: use shadcn Button, Avatar, DropdownMenu for settings/user menu
- [ ] 0.7 Redesign project sidebar: add Lucide icons to each step, use shadcn navigation patterns
- [ ] 0.8 Redesign home page: project list as shadcn Cards with proper typography, hover effects, delete via AlertDialog
- [ ] 0.9 Redesign new project form: shadcn Input, Textarea, Label, Button components
- [ ] 0.10 Redesign settings page: shadcn Select, Input, Card, Badge for configured providers
- [ ] 0.11 Redesign upload page: polished drag-and-drop zone with shadcn Card, Progress bar for upload
- [ ] 0.12 Redesign structure review: shadcn Cards with Checkbox, Badge for column types
- [ ] 0.13 Redesign categories page: shadcn Cards with Badge for sample counts, Dialog for AI scan results
- [ ] 0.14 Redesign dashboard: shadcn Cards for score cards, Badge for sentiment, Tabs for sub-views
- [ ] 0.15 Redesign noise filters: pill/tag input for keywords (Badge with X button), AlertDialog for delete
- [ ] 0.16 Redesign summary page: proper markdown container, shadcn Button for actions
- [ ] 0.17 Replace all browser confirm() with shadcn AlertDialog
- [ ] 0.18 Replace all inline success/error messages with shadcn Toast (Sonner)
- [ ] 0.19 Add loading skeletons using shadcn Skeleton component for page load states
- [ ] 0.20 Verify light mode and dark mode look polished on all pages
- [ ] 0.21 Write tests for theme toggle, verify component rendering
- [ ] 0.22 Update specs, README, CLAUDE.md with shadcn/ui documentation

## 1. Authentication Foundation

- [ ] 1.1 Install next-auth@5, @auth/typeorm-adapter, bcryptjs
- [ ] 1.2 Create User entity (lib/db/entities/User.ts) with name, email, password, image fields
- [ ] 1.3 Create NextAuth config (lib/auth/config.ts) with GitHub, Google, and Credentials providers
- [ ] 1.4 Create auth API route (app/api/auth/[...nextauth]/route.ts)
- [ ] 1.5 Create login page (app/login/page.tsx) with provider buttons and email/password form
- [ ] 1.6 Create middleware.ts for route protection (exclude /login, /api/auth, static assets)
- [ ] 1.7 Add userId FK to Project entity, update project CRUD to scope by authenticated user
- [ ] 1.8 Create admin settings page (app/admin/page.tsx) with display name, connected accounts
- [ ] 1.9 Add AUTH_REQUIRED env var to disable auth for local development
- [ ] 1.10 Write tests for auth schemas, middleware logic, user scoping
- [ ] 1.11 Update specs, README, CLAUDE.md with auth documentation

## 2. GitHub Integration

- [ ] 2.1 Install @octokit/rest
- [ ] 2.2 Create GitHubConfig entity (lib/db/entities/GitHubConfig.ts) with repoOwner, repoName, encryptedPat
- [ ] 2.3 Create GitHubIssue entity (lib/db/entities/GitHubIssue.ts) with issueNumber, url, title, labels
- [ ] 2.4 Create GitHub repo config page in project settings (app/project/[id]/github/page.tsx)
- [ ] 2.5 Create API route to save/validate GitHub config (app/api/projects/[id]/github/route.ts) — validates PAT by calling repos endpoint
- [ ] 2.6 Create issue template builder (lib/github/issue-template.ts) — markdown template with NPS impact, quotes, recommendations
- [ ] 2.7 Create API route to export category as GitHub issue (app/api/projects/[id]/github/issues/route.ts)
- [ ] 2.8 Add "Export to GitHub" action on category breakdown cards (components/nps/CategoryBreakdown.tsx)
- [ ] 2.9 Add comment selection + batch export to GitHub from data table
- [ ] 2.10 Create GitHub Issues tracker tab (app/project/[id]/github/page.tsx) showing created issues with status
- [ ] 2.11 Add "GitHub" step to project sidebar navigation
- [ ] 2.12 Write tests for issue template builder, GitHub config schema validation
- [ ] 2.13 Update specs, README with GitHub integration documentation

## 3. RAG Chat Analysis

- [ ] 3.1 Add embedding column to Comment entity: @Column("vector", { length: 1536, nullable: true })
- [ ] 3.2 Add embeddingProvider, embeddingModel, embeddingDimensions, chatEnabled columns to Project entity
- [ ] 3.3 Create embedding provider abstraction (lib/ai/embeddings.ts) — supports OpenAI, Azure, Ollama embedding endpoints
- [ ] 3.4 Create API route for embedding pipeline (app/api/ai/embed/route.ts) — batch embed comments with progress
- [ ] 3.5 Create API route for chat (app/api/ai/chat/route.ts) — embed question, vector search, LLM answer with citations
- [ ] 3.6 Create ChatMessage entity (lib/db/entities/ChatMessage.ts)
- [ ] 3.7 Build "Enable Chat Analysis" button on dashboard with embedding progress UI
- [ ] 3.8 Build chat panel component (components/nps/ChatPanel.tsx) — input, message history, cited comments
- [ ] 3.9 Handle Anthropic provider fallback — detect and prompt for embedding provider config
- [ ] 3.10 Create API route to get chat history (app/api/projects/[id]/chat/route.ts)
- [ ] 3.11 Write tests for embedding provider abstraction, chat message schemas
- [ ] 3.12 Update specs, README with chat analysis documentation

## 4. Contextual AI Assistant

- [ ] 4.1 Create AssistantPanel component (components/ui/AssistantPanel.tsx) — floating, collapsible chat
- [ ] 4.2 Create assistant prompt builder (lib/ai/assistant-prompts.ts) — context injection per page
- [ ] 4.3 Create API route for assistant chat (app/api/ai/assistant/route.ts) — receives page context, returns guidance
- [ ] 4.4 Add AssistantPanel to project layout (app/project/[id]/layout.tsx)
- [ ] 4.5 Implement context collection per page: upload status, structure confirmation, category list, NPS stats, noise filters
- [ ] 4.6 Add proactive recommendations: detect patterns and suggest actions
- [ ] 4.7 Write tests for assistant prompt builders
- [ ] 4.8 Update specs, README with assistant documentation

## 5. Integration and Polish

- [ ] 5.1 End-to-end test: login → create project → full workflow → chat analysis → export to GitHub
- [ ] 5.2 Update all OpenSpec specs with final implementation details
- [ ] 5.3 Update README with complete SaaS features documentation
- [ ] 5.4 Update CLAUDE.md with new architecture, commands, and conventions
- [ ] 5.5 Verify: clean clone → docker compose up → npm install → npm run dev → full workflow

## Why

A Codex-assisted UX and security review identified 9 bugs across the app — 1 security issue (cross-project API access), 2 data-accuracy bugs (noise counts, chat filtering), and 6 UX gaps (error states, stale selection, double-toggle). These must be fixed before the app is viable for multi-user deployment or public release.

## What Changes

### Security
- **Add project ownership checks to all project-scoped sub-routes** — currently only `projects/[id]/route.ts` verifies ownership; the 10 sub-routes (comments, stats, categories, structure, export, noise, chat, summary, github, github/issues) query by projectId without checking the current user owns that project

### Data Accuracy
- **Remove hard limit=100 cap for noise preview counts** — noise page requests up to 10,000 comments for keyword match previews but the comments API hard-caps at 100, producing underreported counts. Add a dedicated count endpoint or internal limit bypass
- **Fix chat category filtering for multi-select** — chat API uses exact equality for category filter; should support comma-separated values like the comments API already does

### UX Robustness
- **Fix column checkbox double-toggle on Structure page** — row `onClick` and checkbox `onChange` both call `toggleColumn`, causing double-fire
- **Add error states to dashboard** — stats/comments fetch failures silently leave the UI in skeleton state forever
- **Reset DataTable selection on data change** — selected IDs persist across page/filter changes, causing stale counts and export issues
- **Add error state to Projects page** — fetch failures show "No projects" instead of error + retry
- **Add terminal states for top quote cards** — fetch failure or no qualifying comments leaves "Loading..." forever
- **Populate category stats for existing categories** — reopening persisted categories shows "Analyzed 0 of 0 comments" until re-discovery

## Non-goals

- Comprehensive E2E testing (that's Group 5)
- Rate limiting or advanced API security beyond ownership checks
- Redesigning the noise filter architecture (just fixing the count accuracy)

## User-facing flow impact

- **Multi-user auth**: Users will no longer be able to access other users' project data via direct API calls
- **Noise page**: Match preview counts will reflect actual totals, not capped at 100
- **Dashboard chat**: Multi-category filtering will return correct results in chat context
- **Structure page**: Checkbox toggling works correctly on first click
- **All pages with data fetching**: Users see clear error messages with retry options instead of infinite loading

## Capabilities

### New Capabilities
- `api-security`: Project ownership guard for all project-scoped API sub-routes
- `error-handling`: Consistent error states and terminal loading states across all data-fetching pages

### Modified Capabilities
- `ui-redesign`: Fix checkbox double-toggle, reset table selection, populate category stats
- `chat-analysis`: Multi-category filter support in chat retrieval

## Impact

- **API routes** (10 files): All `app/api/projects/[id]/*/route.ts` — add ownership guard
- **Comments API**: Remove or bypass hard limit for noise count use case
- **Chat API**: `app/api/ai/chat/route.ts` — multi-category IN filter
- **Structure page**: `app/project/[id]/structure/page.tsx` — event propagation fix
- **Dashboard page**: `app/project/[id]/dashboard/page.tsx` — error state
- **DataTable component**: `components/nps/DataTable.tsx` — selection reset
- **Projects page**: `app/page.tsx` — error state + quote terminal states
- **Categories page**: `app/project/[id]/categories/page.tsx` — stats from backend
- **Shared utility**: New `lib/auth/assert-project-access.ts` guard function

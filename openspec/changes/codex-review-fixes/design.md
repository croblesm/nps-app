## Context

Codex-assisted review found 9 bugs: 1 security (cross-project API access), 2 data-accuracy (noise counts, chat filtering), 6 UX (error states, double-toggle, stale selection, misleading stats). The app is nearing public release on `nps-saas-features` branch with 142/148 tasks complete.

Currently, only `app/api/projects/[id]/route.ts` has ownership checks via `findProjectForUser()`. The 10 sub-routes and 7 AI routes query by projectId without verifying ownership.

## Goals / Non-Goals

**Goals:**
- Close the cross-project data access vulnerability
- Fix data accuracy bugs (noise counts, chat multi-category)
- Add error/terminal states to all data-fetching UI surfaces
- Fix minor UX bugs (checkbox double-toggle, stale selection, 0/0 stats)

**Non-Goals:**
- Rate limiting or advanced API security
- Redesigning noise filter architecture
- Adding comprehensive E2E tests (Group 5)
- Changing the comments API pagination limit (100 is fine for normal use)

## Decisions

### D1: Shared `assertProjectAccess()` utility
**Choice:** Create `lib/auth/assert-project-access.ts` exporting an async function that verifies project ownership and returns the project, or throws/returns null.

**Rationale:** The existing `findProjectForUser()` in `projects/[id]/route.ts` is local to that file. A shared utility avoids duplication across 17 routes. When `AUTH_REQUIRED=false`, the function skips the ownership check (returns project by ID only).

**Alternative considered:** Middleware-based approach — rejected because project-scoped middleware would need to parse projectId from both URL params and request body (AI routes), adding complexity.

### D2: Dedicated noise count endpoint
**Choice:** Add `GET /api/projects/[id]/noise/count?keywords=word1,word2` that returns `{ count: number }` using a SQL COUNT query.

**Rationale:** The current workaround (requesting limit=10000) hits the 100-cap. A COUNT query is more efficient than returning all comment payloads and counting client-side. Keeps the existing comments API limit intact for its primary pagination use case.

**Alternative considered:** Adding an internal `_internalLimit` query param — rejected as it creates a backdoor in the public API.

### D3: Chat multi-category filter
**Choice:** In `app/api/ai/chat/route.ts`, split the `filters.category` string on commas and use `.includes()` array check instead of strict equality.

**Rationale:** Mirrors the fix already applied to the comments API (commit 737c47d). The chat route filters comments in JavaScript after loading them (for cosine similarity), so this is a simple array membership check.

### D4: Error state pattern
**Choice:** Add `error` state variables alongside `loading` in dashboard, projects page, and quote cards. On fetch failure, set error state and render an error card with retry button. Pattern: `{ loading, error, data }` triple.

**Rationale:** Consistent pattern across all pages. Using a `{ loading, error, data }` triple is a React standard. Retry simply re-calls the fetch function.

### D5: DataTable selection reset via useEffect
**Choice:** Add a `useEffect` in DataTable that clears `selected` when the `comments` prop reference changes.

**Rationale:** Simple and reliable. When page/filter/sort changes, the parent passes new comments, triggering the reset. No need for a separate "data version" prop.

### D6: Structure page checkbox fix
**Choice:** Add `e.stopPropagation()` on the checkbox `onChange` handler.

**Rationale:** The row `onClick` is useful for clicking anywhere on the row to toggle. The checkbox just needs to stop the event from bubbling up to the row handler.

### D7: Categories stats from backend
**Choice:** When loading existing categories, query the stats (sample size, total comments) from the project or last discovery run and pass them to the UI.

**Rationale:** The categories API already returns category data. Adding `sampleSize` and `totalComments` from the project entity avoids showing misleading 0/0.

## Risks / Trade-offs

- **[Risk] Adding assertProjectAccess to 17 routes is tedious** → Mitigated by keeping the function simple (3-4 lines per route call). Could later be extracted to middleware.
- **[Risk] Noise count endpoint adds API surface** → Acceptable; it's a simple read-only COUNT query scoped to project owner.
- **[Risk] Selection reset on every data change might clear intentional selections** → Acceptable trade-off; stale selections across pages are worse than losing selections on page change.

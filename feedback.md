# NPS App UX & Bug Review

## Executive summary
The app is solid in core flow (tests pass and major features are implemented), but I found a few high-impact issues around access control, filtering correctness, and error-state UX. The biggest risks are cross-project API access (security) and inaccurate filtering behavior that can mislead analysis.

## Bugs (functional + security)

### 1) **[High] Missing project ownership checks on most project-scoped APIs**
**What happens:** Many `/api/projects/[id]/*` routes query by `projectId` only and do not verify the current user owns that project.
**Impact:** Any authenticated user who gets another project UUID could read/modify/export another user’s data.
**Recommendation:** Add a shared `assertProjectAccess(projectId, userId)` guard and apply it across all project-scoped routes (including AI routes that accept `projectId` in request body).

### 2) **[High] Noise filter match previews are inaccurate**
**What happens:** Noise page requests `limit=10000` for preview/counts, but comments API hard-caps limit to `100`.
**Impact:** Match counts are often underreported, so users may configure filters based on incorrect numbers.
**Recommendation:** Add a dedicated server endpoint for exact keyword match counts (or allow larger server-side internal limits for this use case).

### 3) **[High] Chat category filtering breaks for multi-select category chips**
**What happens:** Dashboard sends categories as comma-separated string, but chat API compares category with strict equality as a single value.
**Impact:** With multiple categories selected, chat retrieval can return empty/irrelevant results.
**Recommendation:** Parse comma-separated categories in chat API and apply `IN`-style matching (same behavior as comments API).

### 4) **[Medium] Column checkbox toggles twice on Structure page**
**What happens:** Row `onClick` and checkbox `onChange` both call `toggleColumn`.
**Impact:** Clicking the checkbox can toggle on then immediately off, appearing broken.
**Recommendation:** Keep only one toggle handler, or call `e.stopPropagation()` on the checkbox.

### 5) **[Medium] Dashboard can remain in perpetual skeleton state on API failure**
**What happens:** If stats/comments fetch fails, there is no error state; render guard `loading || !nps` keeps showing skeleton.
**Impact:** Users see infinite loading instead of actionable feedback.
**Recommendation:** Add explicit error state + retry action for stats/comments requests.

### 6) **[Medium] Table selection state becomes stale across pagination/filter changes**
**What happens:** `DataTable` keeps selected IDs when `comments` prop changes.
**Impact:** Selected count can be wrong; export may run with zero visible selected comments.
**Recommendation:** Reset selection when page/filter result set changes, or scope selection to current page explicitly.

## UX problems

### 7) **[Medium] Projects page hides API errors as empty state**
**What happens:** Failed project fetch is swallowed and UI may show “No projects yet”.
**Impact:** Users can think data was lost.
**Recommendation:** Show a clear “Failed to load projects” state with retry.

### 8) **[Low] “Top promoter/Top concern” can show “Loading...” forever**
**What happens:** Quote fetch failures or missing qualifying comments never transition to a terminal state.
**Impact:** Ambiguous UX and reduced trust.
**Recommendation:** Introduce explicit states: `loading`, `loaded`, `unavailable` (“No quote available”).

### 9) **[Low] Categories screen shows misleading stats when reopening existing categories**
**What happens:** For persisted categories, `sampleSize/totalComments` remains default `0/0`.
**Impact:** Header text is confusing (“Analyzed 0 of 0 comments”).
**Recommendation:** Populate stats from backend on load, or hide that sentence when stats are unknown.

## Suggested implementation order
1. Fix ownership checks across project-scoped APIs.
2. Fix noise count accuracy and chat multi-category filtering.
3. Fix Structure checkbox double-toggle and DataTable stale selection.
4. Improve dashboard/projects error states and quote/category UX polish.

## Context

Dashboard has a static noise filter banner showing filter names and excluded count. Summary page ignores noise entirely. Users want to temporarily toggle filters on/off to compare NPS with/without noise — session-only, no DB changes.

## Goals / Non-Goals

**Goals:**
- Interactive noise filter chips on Dashboard and Summary
- Session-only toggle (client-side state, no DB mutation)
- Stats and summary APIs accept filter override params
- Shared reusable chip component

**Non-Goals:**
- Persisting toggle state across page navigations
- Adding toggles to other pages

## Decisions

### D1: Shared NoiseFilterChips component
**Choice:** Create `components/nps/NoiseFilterChips.tsx` — a reusable bar that renders each filter as a toggle Badge. Props: `filters: { id, name, active }[]`, `onToggle(id)`, `excludedCount`.

**Rationale:** Dashboard and Summary both need the same UI. Extract once, use twice. The component is purely presentational — parent manages the toggle state.

### D2: Stats API accepts filter exclusion override
**Choice:** Add optional `?excludeFilterIds=id1,id2` query param to `/api/projects/[id]/stats`. When provided, only the listed filter IDs are applied for noise exclusion (overriding the DB `isActive` state). When omitted, behavior is unchanged (all active filters apply).

**Rationale:** The dashboard already fetches stats. Adding a query param is the lightest way to let the client control which filters apply. No new endpoints needed.

**Implementation:** Instead of checking `isNoise` column (which is baked into the data), the stats API will re-compute noise exclusion dynamically using the filter keywords for the specified filter IDs. This means:
- Fetch the specified filters' keywords
- Build a WHERE clause excluding comments matching those keywords
- Compute NPS stats with that exclusion

Actually, simpler approach: the `isNoise` flag on comments already reflects all active filters. When the user toggles OFF a filter, we need to stop excluding those comments. Since `isNoise` was set by ALL filters combined, we can't easily "subtract" one filter. 

**Revised approach:** Use a `?noiseMode=off` param that ignores `isNoise` entirely (no exclusion). Or `?noiseMode=custom&filterIds=id1,id2` that re-computes noise from scratch using only the specified filter keywords.

**Final choice:** Keep it simple. The stats API accepts `?excludeNoise=true|false`. When `false`, skip all noise exclusion. When `true` (default), apply as today. For per-filter granularity, pass `?activeFilterIds=id1,id2` — the API re-queries only those filters' keywords and computes exclusion dynamically instead of relying on the `isNoise` column.

### D3: Summary API accepts noise flag
**Choice:** Add optional `excludeNoise: boolean` and `activeFilterIds: string[]` to the summarize request body. When `excludeNoise=true`, filter out noise comments before passing to the LLM.

**Rationale:** The summarize API currently sends ALL comments to the LLM. Adding noise filtering is a simple `.filter()` before building the prompt.

### D4: Dashboard toggle state
**Choice:** Client-side `useState<Set<string>>` tracking which filter IDs are currently active. Initialized from the stats response's filter list. When a chip is toggled, re-fetch stats with the new activeFilterIds.

**Rationale:** Session-only by design. State resets on page navigation (acceptable per user's request).

## Risks / Trade-offs

- **[Risk] Per-filter toggle requires dynamic re-computation** — Can't just toggle `isNoise` column since it's the union of all filters. Must re-apply keywords for selected filters on the fly. → Acceptable performance for dashboard stats (single SQL query).
- **[Risk] Stats re-fetch on every toggle** — Each chip toggle triggers an API call. → Acceptable; stats query is fast. Could debounce if needed.

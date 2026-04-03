## 1. Shared Component

- [x] 1.1 Create `components/nps/NoiseFilterChips.tsx` — reusable toggle chip bar. Props: filters array with id/name/active, onToggle callback, excludedCount number. Renders each filter as a clickable Badge with active/disabled styling.

## 2. Stats API Filter Override

- [x] 2.1 Update `app/api/projects/[id]/stats/route.ts` — accept optional `excludeNoise` and `activeFilterIds` query params. When `excludeNoise=false`, skip noise exclusion entirely. When `activeFilterIds` is provided, compute noise dynamically from those filters' keywords instead of using the `isNoise` column.

## 3. Dashboard Integration

- [x] 3.1 Update `app/project/[id]/dashboard/page.tsx` — add `activeFilterIds` state (Set<string>) initialized from stats response. Replace static noise banner with NoiseFilterChips component. On toggle, re-fetch stats with updated activeFilterIds param.

## 4. Summary Integration

- [x] 4.1 Update `app/project/[id]/summary/page.tsx` (server component) — fetch noise filters from DB, pass to SummaryClient as initialFilters prop
- [x] 4.2 Update `app/project/[id]/summary/summary-client.tsx` — add noise filter toggle state, render NoiseFilterChips above AI Summary card. Pass excludeNoise + activeFilterIds to summarize API and to NPS visual cards stats.
- [x] 4.3 Update `app/api/ai/summarize/route.ts` — accept optional `excludeNoise` boolean and `activeFilterIds` array in body. When excludeNoise=true, filter out noise comments (by keyword matching against specified filters) before building the LLM prompt.

## 5. Verification

- [x] 5.1 Verify: npm run build passes, npm test passes
- [x] 5.2 Update CLAUDE.md with noise filter toggle pattern

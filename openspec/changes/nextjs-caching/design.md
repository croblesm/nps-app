## Context

The app has zero caching at any level. Server components run fresh DB queries on every render. Client components in the layout (sidebar, topbar) make duplicate API calls. API routes return no Cache-Control headers. This creates unnecessary latency on every page navigation.

## Goals / Non-Goals

**Goals:**
- Reduce redundant DB queries and API calls per page navigation
- Enable browser caching for read-heavy API routes
- Cache expensive server-side queries with automatic invalidation on mutations

**Non-Goals:**
- Adding client-side cache libraries (SWR, React Query)
- Converting client components to server components
- CDN or edge caching

## Decisions

### D1: React `cache()` for request deduplication
**Choice:** Wrap `assertProjectAccess` with React's `cache()` function.

**Rationale:** Every server component page calls `assertProjectAccess(id)`. If the layout or nested components also call it, the DB query runs multiple times per request. React `cache()` deduplicates calls with the same arguments within a single render. One-line change, zero risk.

### D2: Cache-Control headers with short TTLs
**Choice:** Add `Cache-Control: private, max-age=N` to all GET API route responses. TTLs range from 5s (comments) to 300s (auth providers).

**Rationale:** `private` ensures only the browser caches (not proxies). Short TTLs (5-60s) prevent stale data while eliminating redundant requests during rapid navigation. No explicit invalidation needed — TTL expiry handles it. Mutation endpoints (POST/PATCH/DELETE) don't need headers since browsers don't cache those.

### D3: Shared `useProject` hook with module-level cache
**Choice:** Create `lib/hooks/use-project.ts` — a custom hook that caches project data in a module-level Map with 60s TTL. Both AppSidebar and TopBar use this instead of independent useEffect+fetch.

**Rationale:** React Context would require restructuring LayoutWrapper. A module-level cache is simpler — it persists across renders within the same browser session and deduplicates concurrent requests. The 60s TTL ensures freshness.

### D4: `unstable_cache` for server-side DB queries
**Choice:** Create `lib/db/cached-queries.ts` with `unstable_cache`-wrapped versions of expensive queries (stats, noise filters, summary). Use project-specific cache tags for targeted invalidation.

**Rationale:** `unstable_cache` is the documented Next.js 15 approach for caching non-fetch async operations (like TypeORM queries). Project-specific tags (`project-stats-{id}`) ensure invalidating one project's cache doesn't affect others.

### D5: `revalidateTag` on mutations
**Choice:** Call `revalidateTag` at the end of mutation handlers (upload, classify, noise CRUD, summarize, category save, project update).

**Rationale:** Tag-based invalidation is precise — only the affected caches are busted. Time-based expiry alone would leave stale data visible for up to TTL seconds after a mutation.

## Risks / Trade-offs

- **[Risk] `unstable_cache` API may change in Next.js 16** → Acceptable; it's the documented approach for v15. Migration to `use cache` is straightforward if needed.
- **[Risk] Dev mode may not cache aggressively** → `unstable_cache` behavior differs in dev vs production. Test with `npm run build && npm start` for accurate measurements.
- **[Risk] Short Cache-Control TTLs still show stale data briefly** → Acceptable for 5-60s windows. Mutations trigger explicit client re-fetches (e.g., dashboard calls fetchStats after classify).

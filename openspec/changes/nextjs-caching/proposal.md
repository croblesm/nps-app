## Why

Every page navigation triggers fresh DB queries and API calls with zero caching. The sidebar and topbar both independently fetch the same project info, API routes return no Cache-Control headers (so browsers can't cache), and server component DB queries run fresh every request even when data hasn't changed. This makes navigation feel sluggish, especially on project pages with multiple data sources.

## What Changes

### Request deduplication
- **React `cache()` on `assertProjectAccess`** — deduplicates the ownership check DB query when multiple components in the same render tree call it
- **Shared `useProject` hook** — eliminates duplicate project fetch between AppSidebar and TopBar (both currently fetch `/api/projects/{id}` independently)

### Browser caching
- **Cache-Control headers on all GET API routes** — lets the browser skip identical requests within a short TTL window (5-300s depending on data volatility)

### Server-side caching
- **`unstable_cache` for DB queries** — caches expensive server component queries (stats, noise filters, summary) across requests with tag-based invalidation
- **`revalidateTag` on mutations** — busts relevant caches when data changes (upload, classify, noise CRUD, summarize)

## Non-goals
- Adding SWR/React Query (would require new dependency + dashboard refactor)
- Converting Dashboard/Categories to server components (too invasive)
- CDN/edge caching (app runs locally)

## User-facing flow impact
- **Faster page transitions** — navigating between project pages reuses cached data instead of re-fetching
- **No stale data after mutations** — cache is invalidated when users upload, classify, or edit filters
- **Same visual behavior** — no UI changes, just faster loading

## Capabilities

### New Capabilities
- `caching`: Browser Cache-Control headers, React cache() deduplication, unstable_cache with tag-based revalidation

### Modified Capabilities
_(none — implementation-level optimization only)_

## Impact

- **New files** (2): `lib/hooks/use-project.ts`, `lib/db/cached-queries.ts`
- **API routes** (10): Add Cache-Control headers to GET handlers
- **Mutation routes** (6): Add revalidateTag calls after data changes
- **Server component pages** (2): Use cached queries instead of inline DB access
- **Layout components** (2): Use shared useProject hook
- **Auth utility** (1): Wrap with React cache()

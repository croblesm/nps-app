## Context

All 7 project pages are `"use client"` components that fetch data via `useEffect` + `fetch()` on mount. This causes a 1-2 second flash where users see default/empty state before data arrives. Five simpler pages will be converted to the Next.js App Router server component pattern. Dashboard and Categories already have good skeleton loaders and heavy client state, so they stay as-is.

## Goals / Non-Goals

**Goals:**
- Eliminate the data-fetching flash on 5 project pages by loading initial data server-side
- Maintain all existing client-side interactivity unchanged
- Follow Next.js App Router best practices (server components by default, "use client" only for interactivity)

**Non-Goals:**
- Caching, ISR, or streaming SSR
- Converting Dashboard or Categories pages
- Changing API routes or adding new endpoints

## Decisions

### D1: Server/client split pattern
**Choice:** Each page becomes an async server component that fetches initial data via `getDb()` + TypeORM, then passes it as props to a client component that handles all interactivity.

```
app/project/[id]/upload/page.tsx        → async server component (data fetch)
app/project/[id]/upload/upload-client.tsx → "use client" (drag-drop, parsing, upload)
```

**Rationale:** This is the standard Next.js 15 App Router pattern. Server components can directly query the database without an HTTP round-trip. The client component receives initial data as props, eliminating the flash.

**Alternative considered:** Using `fetch()` with Next.js cache in server components — rejected because we already have direct DB access via `getDb()`, which is simpler and avoids an unnecessary HTTP hop.

### D2: Direct DB queries in server components
**Choice:** Server components use `getDb()` + TypeORM directly (same as API routes) rather than calling fetch to our own API.

**Rationale:** Server components run on the server, so they can access the database directly. Calling our own API routes would add unnecessary latency. We also need ownership checks, which `assertProjectAccess()` handles.

### D3: Client component naming convention
**Choice:** Client components named `{page-name}-client.tsx` in the same directory as the page.

**Rationale:** Co-location keeps related code together. The `-client` suffix makes the split obvious.

### D4: Loading states via Next.js loading.tsx
**Choice:** Add `loading.tsx` files for each converted page directory to show skeletons during server component data fetching.

**Rationale:** Next.js automatically wraps the page in a Suspense boundary using `loading.tsx`. This provides a skeleton while the server component's async data fetch completes, which handles the case where the DB query takes time.

### D5: assertProjectAccess in server components
**Choice:** Each server component calls `assertProjectAccess(id)` before querying data. If access is denied, redirect to home or show 404.

**Rationale:** Server components need the same security guard as API routes. The shared `assertProjectAccess()` utility handles both AUTH_REQUIRED=false and multi-user ownership checks.

## Risks / Trade-offs

- **[Risk] Props serialization** — Server → client props must be serializable (no functions, no class instances). TypeORM entities need to be mapped to plain objects. → Mitigated by mapping to simple interfaces (same shape as current API responses).
- **[Risk] Interactivity after mutation** — After a client-side action (e.g., creating a noise filter), the client component needs to refresh data. It will continue to use `fetch()` for mutations and re-fetch, same as today. Only the *initial* load changes.
- **[Risk] Loading.tsx needed** — Without `loading.tsx`, the page would show nothing during the server data fetch. → Add a `loading.tsx` skeleton for each converted page.

## 1. Request Deduplication (Quick Win)

- [x] 1.1 Wrap `assertProjectAccess` with React `cache()` — `lib/auth/assert-project-access.ts`: import `cache` from "react", wrap the exported function

## 2. Cache-Control Headers on GET API Routes

- [x] 2.1 Add Cache-Control headers to 10 GET API routes: projects/[id] (60s), settings (60s), settings/embeddings (60s), stats (10s), comments (5s), categories (30s), summary (30s), noise (30s), github (30s), auth/providers (300s)

## 3. Shared useProject Hook

- [x] 3.1 Create `lib/hooks/use-project.ts` — custom hook with module-level Map cache (60s TTL), returns { project, loading }
- [x] 3.2 Update `components/app-sidebar.tsx` — replace useEffect project fetch with useProject hook
- [x] 3.3 Update `components/top-bar.tsx` — replace useEffect project fetch with useProject hook

## 4. Server-Side Caching with unstable_cache

- [x] 4.1 Create `lib/db/cached-queries.ts` — getCachedProjectStats (30s), getCachedNoiseFilters (60s), getCachedSummary (120s) using unstable_cache with project-specific tags
- [x] 4.2 Wire revalidateTag into 6 mutation endpoints: upload, classify, noise CRUD, summarize, categories, project update/delete
- [x] 4.3 Update `app/project/[id]/summary/page.tsx` — use cached queries instead of inline DB access
- [x] 4.4 Update `app/project/[id]/noise/page.tsx` — skipped (noise page needs all filters, not just cached active ones; Cache-Control header covers this) — use getCachedNoiseFilters

## 5. Documentation & Verification

- [x] 5.1 Update CLAUDE.md with caching patterns (Cache-Control, unstable_cache, React cache, useProject)
- [x] 5.2 Verify npm run build and npm test pass

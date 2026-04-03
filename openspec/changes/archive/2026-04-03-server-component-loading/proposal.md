## Why

Every project page is a `"use client"` component that renders with empty/default state, fires `useEffect` + `fetch()`, then re-renders with actual data. This causes a 1-2 second flash of misleading content (e.g., "upload a file" when data already exists, or empty filter list when filters exist). The fix is to fetch initial data on the server before rendering, so users see correct content immediately.

## What Changes

### Server component conversion (5 pages)
Split each page into an async server component (data fetch) and a client component (interactivity):
- **Upload/Data page** — Server fetches comment count; client handles drag-drop, CSV parsing, upload
- **Structure page** — Server fetches existing column structure; client handles AI analysis, checkbox toggles
- **Noise Filters page** — Server fetches filter list; client handles CRUD, preview, expand/collapse
- **Summary page** — Server fetches summary, stats, quotes; client handles AI generation, download
- **GitHub Issues page** — Server fetches config + issues; client handles config save, refresh, tabs

### Loading state fixes (2 pages)
- **Upload page** — Currently shows "upload a file" before data loads; will render correct state immediately via server data
- **Noise page** — Currently shows empty list before filters load; will render correct state immediately via server data

### No changes to Dashboard or Categories
These already have proper skeleton loaders and heavy client-side filter/pagination state. Converting them would be high effort for marginal benefit since skeletons already prevent misleading content.

## Non-goals
- Changing API routes or database queries
- Adding caching or prefetching strategies
- Modifying the sidebar, layout, or navigation
- Touching Dashboard or Categories pages (already have good loading states)

## User-facing flow impact
- All 5 converted pages load with correct data on first render — no flash of empty/default state
- Navigation between project pages feels instant for the initial data display
- Interactive operations (AI analysis, CRUD, file upload) continue to work identically

## Capabilities

### New Capabilities
_(none — this is an implementation-level optimization, no new user-facing capabilities)_

### Modified Capabilities
- `ui-redesign`: Project pages use server components for initial data loading instead of client-side fetch

## Impact

- **5 page files refactored**: `app/project/[id]/{upload,structure,noise,summary,github}/page.tsx`
- **5 new client component files**: Each page's interactive portion extracted to a client component (e.g., `UploadClient.tsx`)
- **No API changes** — same endpoints, same data
- **No new dependencies**

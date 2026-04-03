## 1. Upload/Data Page

- [x] 1.1 Create `app/project/[id]/upload/upload-client.tsx` — extract all client-side logic (drag-drop, CSV parsing, upload, state) from current page into a client component that accepts `initialDataExists: boolean` and `initialRowCount: number` as props
- [x] 1.2 Convert `app/project/[id]/upload/page.tsx` to async server component — fetch comment count via getDb(), call assertProjectAccess(), pass initial data to UploadClient
- [x] 1.3 Create `app/project/[id]/upload/loading.tsx` — skeleton with title placeholder and card placeholder

## 2. Structure Page

- [x] 2.1 Create `app/project/[id]/structure/structure-client.tsx` — extract client logic (AI analysis, checkbox toggles, saving) accepting `initialStructure` prop (existing column config or null)
- [x] 2.2 Convert `app/project/[id]/structure/page.tsx` to async server component — fetch existing structure via getDb(), pass to StructureClient
- [x] 2.3 Create `app/project/[id]/structure/loading.tsx` — skeleton matching current skeleton UI

## 3. Noise Filters Page

- [x] 3.1 Create `app/project/[id]/noise/noise-client.tsx` — extract client logic (CRUD forms, preview, expand/collapse) accepting `initialFilters` prop
- [x] 3.2 Convert `app/project/[id]/noise/page.tsx` to async server component — fetch filters via getDb(), pass to NoiseClient
- [x] 3.3 Create `app/project/[id]/noise/loading.tsx` — skeleton with filter card placeholders

## 4. Summary Page

- [x] 4.1 Create `app/project/[id]/summary/summary-client.tsx` — extract client logic (generate, download) accepting `initialSummary`, `initialStats`, `initialQuotes` props
- [x] 4.2 Convert `app/project/[id]/summary/page.tsx` to async server component — fetch summary, stats, and quotes via getDb(), pass to SummaryClient
- [x] 4.3 Create `app/project/[id]/summary/loading.tsx` — skeleton matching current skeleton UI

## 5. GitHub Issues Page

- [x] 5.1 Create `app/project/[id]/github/github-client.tsx` — extract client logic (config form, issue list, tabs, refresh) accepting `initialConfig` and `initialIssues` props
- [x] 5.2 Convert `app/project/[id]/github/page.tsx` to async server component — fetch GitHub config + issues via getDb(), pass to GitHubClient
- [x] 5.3 Create `app/project/[id]/github/loading.tsx` — skeleton with tab and card placeholders

## 6. Verification & Documentation

- [x] 6.1 Verify npm run build passes with all 5 converted pages
- [x] 6.2 Update CLAUDE.md with server component pattern (server fetch + client interactivity split)

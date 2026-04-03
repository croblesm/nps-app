## 1. Project Ownership Guard (Security)

- [x] 1.1 Create shared `lib/auth/assert-project-access.ts` — async function that takes projectId, verifies ownership via getCurrentUserId + DB query, returns project or null. Bypasses check when AUTH_REQUIRED=false.
- [x] 1.2 Add assertProjectAccess to all 10 project sub-routes: comments, stats, categories, structure, export, noise, chat, summary, github, github/issues
- [x] 1.3 Add assertProjectAccess to all 7 AI routes that accept projectId in body: validate, categorize, classify, summarize, embed, chat, assistant

## 2. Noise Filter Count Accuracy

- [x] 2.1 Create `app/api/projects/[id]/noise/count/route.ts` — GET endpoint accepting `keywords` query param, returns `{ count }` via SQL COUNT query with LIKE matching
- [x] 2.2 Update noise page (`app/project/[id]/noise/page.tsx`) to call the new count endpoint instead of requesting limit=10000 from comments API

## 3. Chat Multi-Category Filter

- [x] 3.1 Fix `app/api/ai/chat/route.ts` — split `filters.category` on commas and use array `.includes()` check instead of strict equality

## 4. Structure Page Checkbox Fix

- [x] 4.1 Fix `app/project/[id]/structure/page.tsx` — add `e.stopPropagation()` on checkbox onChange to prevent double-toggle from row onClick

## 5. Error States & Terminal Loading

- [x] 5.1 Dashboard page — add error state for stats/comments fetch failures with "Retry" button, replace skeleton with error card
- [x] 5.2 Projects page — add error state for project list fetch failure, show "Failed to load projects" + retry instead of empty state
- [x] 5.3 Projects page quote cards — add terminal states: "—" on fetch error, "No quotes available" when no qualifying comments

## 6. DataTable Selection Reset

- [x] 6.1 Add useEffect in `components/nps/DataTable.tsx` to clear selection when comments prop changes

## 7. Categories Stats for Existing Data

- [x] 7.1 Update categories page to populate sampleSize/totalComments from project data when loading existing categories

## 8. Specs & Documentation

- [x] 8.1 Update CLAUDE.md with assertProjectAccess pattern, noise count endpoint, error state conventions
- [x] 8.2 Update README.md with security and UX improvements

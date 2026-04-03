## Why

Three independent reviews (manual testing, deep code analysis, Codex review) found the auth system is fundamentally broken: OAuth providers crash when env vars are missing, signIn() silently fails without showing errors, profile updates reject with "Unauthorized" in local dev, the /register page doesn't exist, and get-user.ts always returns null. Additionally, three UX issues degrade the experience: Data page has no preview of existing data, Categories shows a "Confirm" button for already-saved categories, and the top bar only shows the LLM model (not embedding).

## What Changes

### Auth Hardening (Critical)
- **Conditional OAuth provider registration** — Only register GitHub/Google providers when env vars exist. New `/api/auth/providers` endpoint tells the login page which buttons to show.
- **signIn() error handling** — Use `redirect: false`, check result, show inline errors on failure, manually redirect on success
- **Profile API respects AUTH_REQUIRED=false** — Return dev stub profile instead of 401 when no session exists in local dev
- **Create /register page** — Server component redirect to `/login?signup=true`
- **Fix get-user.ts dev fallback** — Query first DB user instead of returning null when AUTH_REQUIRED=false
- **Production safety guard** — Console warning when AUTH_REQUIRED=false in production

### Auth Quality
- **Registration race condition** — Catch DB unique constraint errors on concurrent registrations
- **Profile name validation** — Trim whitespace before min-length check

### UX Improvements
- **Data page preview** — Collapsible table showing first 5 rows of existing data
- **Categories confirm button** — Hide when categories are already saved; show only during discovery/editing
- **Top bar embedding model** — Show both LLM and embedding model (e.g., "ollama / mistral:latest | nomic")

## Non-goals
- OAuth app registration (user must configure env vars: AUTH_GITHUB_ID, AUTH_GITHUB_SECRET, etc.)
- Data merge/append capability (deferred feature request)
- Settings hydration warning (browser extension, not our code)

## User-facing flow impact
- **Login page**: OAuth buttons only appear when providers are configured. Credential errors shown inline.
- **Registration**: `/register` redirects to login with signup form pre-selected
- **Admin/profile**: Display name updates work in both dev and auth modes
- **Data page**: Users can preview existing uploaded data before deciding to replace
- **Categories**: No confusing "Confirm" button when revisiting already-saved categories
- **Top bar**: Shows both LLM and embedding provider at a glance

## Capabilities

### New Capabilities
_(none — fixes to existing capabilities)_

### Modified Capabilities
- `authentication`: Conditional OAuth, signIn error handling, profile AUTH_REQUIRED bypass, register redirect, get-user fallback, production guard
- `ui-redesign`: Data preview, categories confirm UX, top bar embedding display

## Impact

- **Auth files** (6): `lib/auth/index.ts`, `lib/auth/get-user.ts`, `lib/auth/config.ts`, `app/login/page.tsx`, `app/api/auth/profile/route.ts`, `app/api/auth/register/route.ts`
- **New files** (2): `app/api/auth/providers/route.ts`, `app/register/page.tsx`
- **UX files** (3): `app/project/[id]/upload/{page,upload-client}.tsx`, `app/project/[id]/categories/page.tsx`, `components/top-bar.tsx`
- **Docs** (1): `CLAUDE.md`

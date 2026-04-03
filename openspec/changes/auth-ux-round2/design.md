## Context

Auth system has 6 critical bugs found by three independent reviewers. OAuth providers crash with `client_id=undefined`, signIn returns silently, profile API ignores AUTH_REQUIRED=false, /register page is missing, get-user.ts has a logic bug (`null : null`), and there's no production guard. Three UX issues also found.

## Goals / Non-Goals

**Goals:**
- Make auth functional in both dev (AUTH_REQUIRED=false) and production modes
- Gracefully handle missing OAuth env vars without crashing
- Show clear error feedback on login failures
- Fix three UX issues (data preview, categories confirm, top bar embedding)

**Non-Goals:**
- OAuth app registration / env var setup (user responsibility)
- Data merge/append feature
- Multi-provider account linking redesign

## Decisions

### D1: Conditional OAuth provider registration
**Choice:** Build providers array dynamically in `lib/auth/index.ts`. Only push GitHub/Google when both ID and SECRET env vars exist.

**Rationale:** NextAuth v5 uses `AUTH_GITHUB_ID`/`AUTH_GITHUB_SECRET` auto-detection. When undefined, the OAuth URL gets `client_id=undefined` causing GitHub 404. Conditional registration prevents the crash entirely.

**Login page awareness:** New lightweight `GET /api/auth/providers` endpoint returns `{ github: bool, google: bool }`. Login page fetches on mount and hides buttons accordingly. Alternative considered: server component — rejected because login page needs client-side form state.

### D2: signIn with redirect: false
**Choice:** Call `signIn("credentials", { ..., redirect: false })`, check `result?.error`, show inline error, then `router.push("/")` on success.

**Rationale:** NextAuth's signIn auto-redirects on success but returns `{ok, error}` on failure without throwing. Current code doesn't check the return value, so failures are silent. Using `redirect: false` gives us control over both outcomes.

### D3: Profile API dev mode bypass
**Choice:** When AUTH_REQUIRED=false, GET returns a stub dev profile, PATCH returns a no-op success response.

**Rationale:** With no session in dev mode, the profile API always returns 401. A real DB update is unnecessary in dev — the stub keeps the admin page functional. Alternative considered: creating a real dev user — rejected as over-engineering for local dev.

### D4: get-user.ts dev fallback
**Choice:** When AUTH_REQUIRED=false and no session, query first user from DB via dynamic import. Fall back to a fixed UUID if no users exist.

**Rationale:** The `assertProjectAccess` function already bypasses ownership checks when !authRequired, so project access works. But `getCurrentUserId()` returning a real user ID (instead of null) ensures project creation assigns a userId, which is better for data consistency. Dynamic import of getDb avoids circular deps.

### D5: Categories saved state tracking
**Choice:** Add `categoriesSaved` boolean state. Set true when loading from DB, false on any edit, true after confirm POST. Hide confirm button when true.

**Rationale:** Simplest approach. Alternative considered: computing a hash of categories array vs last-saved snapshot — over-engineering for this use case.

### D6: Data preview via server component
**Choice:** Server component fetches 5 sample rows from DB, passes as prop. Client renders collapsible `<details>` preview.

**Rationale:** No new API endpoint needed — server component already has DB access. `<details>` element provides native collapse without JS state.

## Risks / Trade-offs

- **[Risk] get-user.ts DB call on every request in dev** → Acceptable for dev mode. Could cache in module-level variable if needed.
- **[Risk] /api/auth/providers exposes configured providers** → Not sensitive (visible on login page anyway)
- **[Risk] Profile stub in dev loses changes on refresh** → Acceptable trade-off for dev mode

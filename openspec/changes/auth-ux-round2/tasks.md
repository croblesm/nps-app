## 1. Auth Hardening (Critical)

- [x] 1.1 Add production guard — `lib/auth/config.ts`: console.warn when AUTH_REQUIRED=false && NODE_ENV=production
- [x] 1.2 Fix get-user.ts — `lib/auth/get-user.ts`: when !authRequired, query first user from DB instead of returning null
- [x] 1.3 Fix profile API — `app/api/auth/profile/route.ts`: GET returns dev stub, PATCH returns no-op success when AUTH_REQUIRED=false
- [x] 1.4 Conditional OAuth providers — `lib/auth/index.ts`: only register GitHub/Google when env vars exist
- [x] 1.5 Create providers endpoint — NEW `app/api/auth/providers/route.ts`: returns { github: bool, google: bool }
- [x] 1.6 Fix login page — `app/login/page.tsx`: use signIn redirect:false with error checking, hide OAuth buttons when not configured, read ?signup=true from URL
- [x] 1.7 Create /register redirect — NEW `app/register/page.tsx`: redirect to /login?signup=true

## 2. Auth Quality

- [x] 2.1 Registration race condition — `app/api/auth/register/route.ts`: wrap repo.save() in try-catch for unique constraint error
- [x] 2.2 Name validation trim — `app/api/auth/profile/route.ts`: use z.string().trim().min(1) in schema

## 3. UX Improvements

- [x] 3.1 Top bar embedding model — `components/top-bar.tsx`: fetch /api/settings/embeddings, display alongside LLM model
- [x] 3.2 Categories confirm button — `app/project/[id]/categories/page.tsx`: add categoriesSaved state, hide confirm when saved
- [x] 3.3 Data page preview — `app/project/[id]/upload/page.tsx` + `upload-client.tsx`: server passes sample rows, client renders collapsible preview table

## 4. Documentation

- [x] 4.1 Update CLAUDE.md with auth patterns (conditional providers, dev mode behavior, signIn pattern)
- [x] 4.2 Verify npm run build and npm test pass

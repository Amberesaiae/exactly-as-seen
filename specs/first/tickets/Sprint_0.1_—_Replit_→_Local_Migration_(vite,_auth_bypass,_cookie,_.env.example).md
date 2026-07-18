# Sprint 0.1 — Replit → Local Migration (vite, auth bypass, cookie, .env.example)

## Goal

Make the codebase run locally without Replit. Three blocking issues fixed, `.env.example` and `docker-compose.yml` created.

## Changes Required

### file:artifacts/lampfarms/vite.config.ts

- Remove the hard `throw new Error(...)` for missing `PORT` and `BASE_PATH`
- Replace with: `const port = Number(process.env.PORT ?? '5173')` and `const basePath = process.env.BASE_PATH ?? '/'`
- Keep the Replit plugin conditional (`process.env.REPL_ID !== undefined`) — already correct

### file:artifacts/api-server/src/routes/auth.ts

- Change `secure: true` on all `res.cookie()` calls to `secure: process.env.NODE_ENV === 'production'`
- Affects `setSessionCookie()` and `setOidcCookie()` helpers

### file:artifacts/api-server/src/lib/auth.ts + file:artifacts/api-server/src/middlewares/authMiddleware.ts

- Add `DEV_AUTH_BYPASS` path: when `process.env.DEV_AUTH_BYPASS === 'true'`, skip OIDC entirely
- Inject a hardcoded `AuthUser` with `id = process.env.DEV_USER_ID ?? 'dev-user-001'`
- The bypass must be **completely disabled** when `NODE_ENV === 'production'` (hard guard)
- Ensure the bypass user has a corresponding farm row (seed or auto-create on first request)

### New files to create

- `.env.example` at workspace root — document all required and optional variables with comments
- `docker-compose.yml` at workspace root — single Postgres 16 service, port 5432, volume for data persistence

## Acceptance Criteria

pnpm --filter @workspace/lampfarms run dev starts without errors when PORT=5173 BASE_PATH=/ are set in .envpnpm --filter @workspace/api-server run dev starts and returns 200 on /api/healthz with DEV_AUTH_BYPASS=trueGET /api/auth/user returns the hardcoded dev user when bypass is activeCookies are not set with Secure flag when NODE_ENV=developmentNODE_ENV=production with DEV_AUTH_BYPASS=true throws a startup error (safety guard).env.example documents every variable used across the monorepo
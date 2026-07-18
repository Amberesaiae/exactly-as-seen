# Sprint 4 — Phase 4: Frontend Rebuilds (Records, Settings, Dashboard) + PWA + Ops

## Goal

Rebuild the three remaining frontend pages, add PWA support, fix mobile nav, and complete ops hardening.

## Scope

### Records Page Rebuild — replace file:artifacts/lampfarms/src/pages/Records.tsx

4-tab layout per file:specs/08_RECORDS.md:

- **Overview tab** — KPI cards (active batches, birds on farm, avg mortality, net profit masked)
- **Batches tab** — list with derived KPIs; detail view with weekly table; compare (2–4 batches) with best-performer highlighting and insights
- **Health tab** — task completion rates, vaccination compliance, withdrawal history
- **Finance tab** — proxies Finance P&L with same privacy rules

PDF/CSV export buttons wired to server-rendered endpoints. No client-side aggregation anywhere.

### Settings Page Rebuild — replace file:artifacts/lampfarms/src/pages/SettingsPage.tsx

5-tab layout per file:specs/10_SETTINGS.md:

- Profile, Farm (+ Houses CRUD), Preferences (GHS/NGN only, timezone, PIN setup), Market Prices, Data
- No password change UI
- Cost-privacy PIN setup (4 digits, stored server-side as hash)

### Dashboard Page Rebuild — replace file:artifacts/lampfarms/src/pages/Dashboard.tsx

Consume `GET /api/v1/dashboard/overview`. Use Dexie `dashboard_cache` for offline rendering. Dashboard follows the same server-side privacy rule as Finance and Records; cache stores whatever the server returned at fetch time, so masked dashboards stay masked offline until a granted refresh occurs.

### Mobile Nav Fix — file:artifacts/lampfarms/src/components/MobileNav.tsx

Change bottom nav to 5 items: Home, Batches, Feed, Water-Health, Settings (per file:specs/09_MAIN_DASHBOARD.md §4). Remove "More" sheet.

### AppSidebar Label Fix — file:artifacts/lampfarms/src/components/AppSidebar.tsx

Change "Water & Health" label to "Water-Health" (spec domain glossary).

### PWA

- Add Workbox `injectManifest` service worker
- PWA install banner component
- Offline routing for known views
- Sync-on-reconnect surface (online event → flush outbox)

### Ops Hardening

- Rate limiting middleware on auth endpoints and all write endpoints
- CORS allowlist for known origins (configurable via env)
- Extend file:lib/api-spec/openapi.yaml to cover all domain endpoints (currently auth-only)
- WCAG 2.1 AA audit on all primary pages

## Acceptance Criteria

Records page has no client-side aggregationRecords compare shows best-performer highlight per metric directionSettings page has no password change UISettings currency selector shows only GHS and NGNDashboard reads from dashboard_cache when offlineDashboard privacy matches Finance/Records server-side masking rulesMobile nav shows exactly 5 items: Home, Batches, Feed, Water-Health, SettingsPWA installs on Chrome desktop and mobileRate limiter returns 429 on abusive trafficOpenAPI spec covers all domain endpointspnpm run typecheck passes
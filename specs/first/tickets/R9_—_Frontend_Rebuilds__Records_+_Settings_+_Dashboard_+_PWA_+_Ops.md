# R9 — Frontend Rebuilds: Records + Settings + Dashboard + PWA + Ops

## Goal

Rebuild the three remaining frontend pages, add PWA support, fix the mobile nav, and complete ops hardening. This is the final ticket — the platform is feature-complete after this.

## Spec Reference

spec:3a092065-e868-4799-849c-f707a0553261/b7f8a421-4897-4bc3-bfc4-850e84f63a24 — Sprint 4 §4.4–4.8

## Dependencies

- R8 (all backend modules must exist)

## Records Page

Replace file:artifacts/lampfarms/src/pages/Records.tsx with 4-tab layout:

| Tab | Data source |
| --- | --- |
| Overview | `GET /api/v1/records/overview` |
| Batches | `GET /api/v1/records/batches` + detail + compare (2–4 batches) |
| Health | Task completion rates, withdrawal history |
| Finance | Proxies Finance P&L with same privacy rules |

PDF/CSV export buttons wired to server-rendered endpoints. No client-side aggregation. No client-side cost masking.

## Settings Page

Replace file:artifacts/lampfarms/src/pages/SettingsPage.tsx (980 lines) with 5-tab layout per file:specs/10_SETTINGS.md:

| Tab | Key changes vs current |
| --- | --- |
| Profile | Remove password change dialog and `PasswordStrengthIndicator` |
| Farm | Add `water_source_chlorinated` toggle; houses CRUD wired to `/settings/houses` |
| Preferences | Currency: GHS/NGN only (remove USD/EUR/GBP); PIN setup for cost privacy |
| Market Prices | New tab — L3 config overrides |
| Data | Export + account deletion |

## Dashboard Page

Replace file:artifacts/lampfarms/src/pages/Dashboard.tsx with spec-compliant version consuming `GET /api/v1/dashboard/overview`. Use Dexie `dashboard_cache` table for offline rendering. Cache stores exactly what the server returned — masked values remain masked in cache.

## Mobile Nav Fix

file:artifacts/lampfarms/src/components/MobileNav.tsx: change to 5 primary items — Home, Batches, Feed, Water-Health, Settings. Eggs, Finance, Stock, Records accessible via sidebar. Change `AppSidebar.tsx` label from "Water & Health" to "Water-Health".

## PWA

- Workbox `injectManifest` service worker
- PWA install banner
- WCAG 2.1 AA audit on all primary pages

## Ops Hardening

- Rate limiting on auth + write endpoints
- CORS allowlist for known origins
- Verify `/healthz`, `/readyz`, `/metrics` endpoints
- Extend file:lib/api-spec/openapi.yaml to cover all domain endpoints (currently auth-only)

## Acceptance Criteria

- Records page shows real aggregated data; no client-side aggregation
- Settings page has 5 tabs; no password change UI; currency options are GHS and NGN only
- Dashboard page uses `GET /api/v1/dashboard/overview`; offline shows cached data
- Mobile nav has exactly 5 items: Home, Batches, Feed, Water-Health, Settings
- AppSidebar label is "Water-Health"
- PWA installs on Chrome
- OpenAPI spec covers all domain endpoints
- `pnpm run typecheck` passes
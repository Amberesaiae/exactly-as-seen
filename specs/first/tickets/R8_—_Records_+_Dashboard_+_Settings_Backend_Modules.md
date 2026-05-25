# R8 — Records + Dashboard + Settings Backend Modules

## Goal

Implement the three remaining backend modules: Records analytics, Dashboard aggregator, and Settings. These are the last backend pieces before the platform is feature-complete.

## Spec Reference

spec:3a092065-e868-4799-849c-f707a0553261/b7f8a421-4897-4bc3-bfc4-850e84f63a24 — Sprint 4 §4.1–4.3
file:specs/08_RECORDS.md, file:specs/09_MAIN_DASHBOARD.md, file:specs/10_SETTINGS.md

## Dependencies

- R7 (Egg Production must exist for Records to aggregate it)

## Records Module — file:artifacts/api-server/src/modules/records/

| Endpoint | Notes |
| --- | --- |
| `GET /api/v1/records/overview` | Aggregated KPIs via SQL CTE |
| `GET /api/v1/records/batches` | List with derived KPIs (CTE query) |
| `GET /api/v1/records/batches/:id` | Detail + weekly rows |
| `GET /api/v1/records/batches/:id/activity` | UNION ALL timeline |
| `POST /api/v1/records/compare` | 2–4 batches, insights |
| `GET /api/v1/records/batches/:id/export` | PDF (`@react-pdf/renderer`) + CSV |

All multi-table aggregations use server-side CTEs. No client-side aggregation. Financial columns respect the same server-side privacy rule as Finance.

## Dashboard Aggregator — file:artifacts/api-server/src/modules/dashboard/

Single endpoint: `GET /api/v1/dashboard/overview`. Composes from internal services in one handler. Response ≤ 400ms p95. Financial values follow server-side privacy — masked responses return `null` plus a privacy indicator.

## Settings Module — file:artifacts/api-server/src/modules/settings/

Per file:specs/10_SETTINGS.md:

| Endpoint group | Notes |
| --- | --- |
| `GET/PATCH /preferences` | Currency (GHS/NGN only), timezone, cost-privacy PIN |
| `GET/PATCH /farm` | Name, location, `water_source_chlorinated`, `egg_low_inventory_crates` |
| `GET/POST/PATCH/DELETE /houses` | Houses CRUD with occupied-batch guard |
| `GET/POST/DELETE /market-prices` | L3 config overrides; safety keys rejected with `422 SAFETY_KEY_NOT_OVERRIDABLE` |
| `GET /species-config` | Read-only viewer |
| `POST /export` | JSON/CSV data export |
| `DELETE /account` | Soft-delete with 30-day recovery window |

## Acceptance Criteria

- Records overview returns aggregated KPIs from real data via CTE
- PDF export returns `%PDF` magic bytes
- Dashboard overview responds in ≤ 400ms on a warm DB
- Dashboard financial values are `null` when privacy is active
- Settings `PATCH /preferences` with `currency = 'USD'` → `400 VALIDATION_FAILED`
- Settings `POST /market-prices` with a safety key → `422 SAFETY_KEY_NOT_OVERRIDABLE`
- Settings `DELETE /houses/:id` with active batch → `409 HOUSE_OCCUPIED`
- `pnpm run typecheck` passes
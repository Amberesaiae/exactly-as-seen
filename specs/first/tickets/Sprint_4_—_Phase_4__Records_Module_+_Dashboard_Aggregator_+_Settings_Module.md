# Sprint 4 — Phase 4: Records Module + Dashboard Aggregator + Settings Module

## Goal

Implement the Records, Dashboard aggregator, and Settings backend modules. These are the final three backend modules needed for feature completeness.

## Scope

### Records Module (file:artifacts/api-server/src/modules/records/)

All endpoints from file:specs/08_RECORDS.md §5:

- `GET /api/v1/records/overview` — aggregated KPIs
- `GET /api/v1/records/batches` — list with CTE-derived KPIs
- `GET /api/v1/records/batches/:id` — detail + weekly rows
- `GET /api/v1/records/batches/:id/activity` — UNION ALL timeline
- `POST /api/v1/records/compare` — 2–4 batches, insights (R6, R7)
- `GET /api/v1/records/batches/:id/export` — PDF (`@react-pdf/renderer`) + CSV
- Cost privacy passthrough: when masked, financial fields are `null` + `financialsMasked: true`
- `record_exports` audit table written on every export

All aggregations via SQL CTEs — no client-side aggregation, no materialised views in v1.

### Dashboard Aggregator (file:artifacts/api-server/src/modules/dashboard/)

`GET /api/v1/dashboard/overview` per file:specs/09_MAIN_DASHBOARD.md §6.6:

- Composes from internal services (batches, health tasks, finance, activity log)
- Maximum one query per source module
- Response target: ≤400ms p95
- Financial values follow the same server-side privacy rule as Finance and Records (`null` + privacy indicator when masked; real values only when grant active)

### Settings Module (file:artifacts/api-server/src/modules/settings/)

Per file:specs/10_SETTINGS.md (written in Sprint 0.4):

- All preferences, farm, houses, market-prices, species-config, export, account endpoints
- Safety-key protection: reject overrides with `422 SAFETY_KEY_NOT_OVERRIDABLE`
- Account deletion: soft-delete with 30-day recovery window

### Sync Delta Extension

Add remaining **read-side cache entities** to `GET /api/sync/delta`: `health_tasks`, `formulations`, `stock_lots`, `expense_entries`, `revenue_entries`, `egg_collections`, `egg_sales`.

Do not expand the old generic outbox into a Phase 2+ command replayer in this ticket. Phase 2+ writes remain online-only until a dedicated command-intent outbox is separately designed.

## Acceptance Criteria

POST /records/compare with 1 batch → 400 COMPARE_TOO_FEW; 5 batches → 400 COMPARE_TOO_MANYPDF export returns Content-Type: application/pdf with %PDF magic bytesCSV export returns RFC-4180 with header rowEvery export writes one record_exports audit rowPrivacy on → financial fields null in all Records responsesDashboard privacy matches Finance/Records server-side masking rulesDashboard aggregator responds in ≤400ms p95 under loadSafety-key override → 422 SAFETY_KEY_NOT_OVERRIDABLEpnpm run typecheck passes
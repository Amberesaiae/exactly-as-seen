# LampFarms — Master Implementation Plan

# LampFarms — Master Implementation Plan

**Status:** Active
**Scope:** All 4 phases, full project, end-to-end
**Canonical stack:** TypeScript / Express 5 / Drizzle ORM / pg-boss / XState v5 / highs-js / React 19 / Dexie v4
**Authoritative specs:** file:specs/ — do not deviate without updating the spec first
**Rule:** file:specs/rule.md — specs are the contract; implementation follows them as written

## Architectural Decisions (Locked)

| Decision | Choice | Rationale |
| --- | --- | --- |
| Job queue | **pg-boss** (canonical) | No Redis available; pg-boss already working; specs updated to reflect this |
| LP solver | **highs-js** in-process | WASM, offline-capable, sub-ms for ≤41 variables |
| FSM | **XState v5** | Already implemented; matches spec |
| Auth (production) | **Replit OIDC** | Platform-native; portable OIDC abstraction added for local dev |
| Auth (local dev) | **`DEV_AUTH_BYPASS=true`** env var | Injects hardcoded user; never ships to production |
| Frontend rebuild | **Backend-first** | API shape must be stable before frontend is rebuilt |
| Migration cutover | **Keep legacy tables live; add new module tables in parallel** | Avoids breaking current pages during backend-first delivery; cleanup happens after frontend cutover |
| Offline writes | **Phase 1 only offline writes; Phase 2+ writes online-only** | Current outbox is table-CRUD only; command-intent offline replay is deferred to a later design pass |
| Inconsistency fixes | **Sprint 0 (pre-Phase-2)** | All 10 selected items fixed before any Phase 2 work begins |

## Sprint 0 — Migration + Inconsistency Fixes

**Goal:** The codebase runs locally, all known pre-Phase-2 inconsistencies are resolved, and the missing `10_SETTINGS.md` spec is written.

### 0.1 Replit → Local Migration

**Files to change:**

- file:artifacts/lampfarms/vite.config.ts — remove hard throws; use `PORT ?? '5173'` and `BASE_PATH ?? '/'` defaults
- file:artifacts/api-server/src/routes/auth.ts — change `secure: true` to `secure: process.env.NODE_ENV === 'production'`
- file:artifacts/api-server/src/lib/auth.ts — add `DEV_AUTH_BYPASS` path that skips OIDC and returns a hardcoded `AuthUser`
- file:artifacts/api-server/src/middlewares/authMiddleware.ts — honour bypass when `DEV_AUTH_BYPASS=true`
- Create `.env.example` at workspace root with all required variables documented
- Create `docker-compose.yml` at workspace root for local Postgres

**`.env.example`**** variables:**

```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/lampfarms
PORT=8080
BASE_PATH=/
NODE_ENV=development
DEV_AUTH_BYPASS=true
DEV_USER_ID=dev-user-001
DEV_FARM_ID=dev-farm-001
# Production only (Replit):
# REPL_ID=...
# ISSUER_URL=https://replit.com/oidc
```

### 0.2 Spec Canonicalisation — pg-boss

Update file:specs/00_CONVENTIONS.md §1 to replace BullMQ/Redis with pg-boss as the canonical job queue. Update file:specs/01_MASTER_ARCHITECTURE.md §7 (Background Jobs) to remove Redis references. Update all phase files in file:specs/phases/ that reference BullMQ.

### 0.3 Inconsistency Fixes (Code)

| File | Fix |
| --- | --- |
| file:artifacts/lampfarms/src/lib/feed-data.ts | Remove `niacin_duck` safety rule (line 132–140) and niacin from `getCompulsorySupplements()` (lines 209–215). Niacin is Water-Health only (CONVENTIONS §2.9) |
| file:artifacts/lampfarms/src/lib/batch-utils.ts | Fix `PHASE_DEFINITIONS` broiler starter to end at Week 3 (not Week 2), matching file:artifacts/api-server/src/modules/batch/fsm.ts |
| file:artifacts/lampfarms/src/lib/health-data.ts | Replace `VACCINATION_TEMPLATES` broiler entries with the 5 canonical vaccinations (Day 7 Gumboro, Day 14 HB1, Day 21 Gumboro+, Day 28 Lasota, Day 35 Gumboro+) per CONVENTIONS §2.8 |
| file:artifacts/lampfarms/src/lib/db.ts | Add `sync_meta`, `conflicts`, `dashboard_cache` tables to Dexie schema per CONVENTIONS §4.6 |
| file:artifacts/lampfarms/src/lib/sync.ts | Replace supabase shim calls with `GET /api/sync/delta?entity=...&since=...` for reads; keep the current outbox limited to existing Phase 1 write flows. Phase 2+ command-style writes remain online-only until a dedicated command-intent outbox exists |
| file:artifacts/lampfarms/src/pages/Records.tsx | Remove client-side aggregation; replace with calls to `/api/v1/records/*` endpoints (stubs until Phase 4 backend is built — show loading state) |
| file:artifacts/lampfarms/src/pages/Records.tsx | Remove client-side cost privacy masking (`mask()` function); rely on server response |
| file:artifacts/lampfarms/src/pages/SettingsPage.tsx | Remove `CURRENCIES` entries for USD, EUR, GBP — keep only GHS and NGN |
| file:artifacts/lampfarms/src/pages/SettingsPage.tsx | Remove password change dialog and `PasswordStrengthIndicator` usage (dead code — Replit OIDC has no passwords) |

### 0.4 Write Missing `10_SETTINGS.md` Spec

The Settings spec is referenced by file:specs/phases/phase4.md but does not exist. It must be written before Phase 4 planning is complete. Content: 5-tab Settings UI (Profile, Farm, Houses, Preferences, Market Prices / Species Config / System / Data), 3-tier config rules, safety-key protection, cost-privacy PIN, currency/timezone round-trip.

## Sprint 1 — Phase 1 Completion

**Goal:** Phase 1 is 100% done. Species config seeds exist, farm water-source state is stored, daily task generation job runs, withdrawal sweep job runs.

### 1.0 Farm Water-Source Flag Prerequisite

Add `water_source_chlorinated boolean not null default false` to the `farms` table before Sprint 2A. This unblocks Water-Health conflict `C8`. If the existing setup/edit flow can expose it early, do so; otherwise default `false` is acceptable until the Settings module is rebuilt, but the column must exist before Water-Health backend work begins.

### 1.1 Species Config Seeds

Seed the `species_config` table with the 5 protocol JSON blobs defined in:

- file:specs/11_PROTOCOL_BROILER.md §10
- file:specs/12_PROTOCOL_LAYER.md (config JSON section)
- file:specs/13_PROTOCOL_DUCK.md §11 (two rows: meat + layer)
- file:specs/14_PROTOCOL_TURKEY.md §11
- file:specs/15_PROTOCOL_OTHER_SPECIES.md §11

Script: file:scripts/src/seed-species-config.ts

### 1.2 `generateDailyBatchTasks` Job

Register a pg-boss job that runs at 06:00 in each farm's timezone. For each active batch, reads the species protocol from `species_config` and materialises `health_tasks` rows for the current day per the schedule. Handles duck niacin auto-task (CONVENTIONS §2.9) and turkey Metronidazole biweekly (CONVENTIONS §2.10).

### 1.3 `checkWithdrawalPeriods` Job

Register a pg-boss job that runs every 4 hours (UTC). Finds batches where `MAX(health_tasks.withdrawal_meat_until) < today` AND `has_active_withdrawal = true`. Sets `has_active_withdrawal = false`, emits `BATCH_WITHDRAWAL_CLEARED` via outbox.

## Sprint 2A — Phase 2 Backend: Water-Health + Feed

**Goal:** Water-Health and Feed modules are fully implemented, tested, and spec-compliant.

### 2A.1 DB Schema Extension — Water-Health + Feed

New Drizzle tables per file:specs/03_WATER_HEALTH.md §3 and file:specs/04_FEED_CALCULATOR.md §3:

- `medications` (52+ rows seeded)
- `container_types` (9 rows seeded per CONVENTIONS §2.3)
- `health_tasks` (evolved in place — add spec-compliant fields while preserving legacy compatibility fields used by the old Health page during transition)
- `ingredients`, `nutritional_requirements`, `formulations`

Migration path: do **not** rename `health_tasks` during backend-first delivery. Extend the existing table additively, keep legacy compatibility columns during transition, and let the new module read/write the spec-compliant columns. Remove legacy-only columns only after the frontend cutover is complete.

### 2A.2 Water-Health Module Backend

Module path: file:artifacts/api-server/src/modules/water-health/

Implements all endpoints from file:specs/03_WATER_HEALTH.md §5:

- `GET /api/v1/health/batches/:batchId/tasks`
- `POST /api/v1/health/tasks` (with C1–C8 conflict matrix)
- `POST /api/v1/health/tasks/:id/complete` (withdrawal tracking)
- `POST /api/v1/health/tasks/:id/skip`
- `GET /api/v1/health/medications`
- `GET /api/v1/health/containers`
- `GET /api/v1/health/batches/:batchId/withdrawals`

Key implementation details:

- Conflict matrix (file:artifacts/api-server/src/modules/water-health/conflicts.ts) — all 8 conflicts; C4 uses a 72-hour window and C6/C7 use real ±4-hour windows
- Task timing: store both farm-local `scheduled_date` and a concrete `scheduled_at` timestamp for conflict evaluation. Auto-generated tasks may use deterministic default times; ad-hoc create flows must provide enough timing precision for C4/C6/C7
- `POST /api/v1/health/tasks` must accept a concrete `scheduled_at` timestamp for ad-hoc task creation. `scheduled_date` alone is insufficient for canonical C4/C6/C7 enforcement.
- Conflict checks for C1 and C3 are order-independent: the guard evaluates the overlap regardless of which medication is being created second.
- `GET /api/v1/health/batches/:batchId/tasks` applies `week` and `status` filters server-side.
- Dosing formula: `dose_amount = medication.dose_per_gallon × (water_volume_l / 3.785)` — legacy `×1.5` formula removed
- Injection delivery methods skip container/dose UI fields
- Duck niacin auto-task on `BATCH_CREATED` event
- Turkey Metronidazole biweekly on `BATCH_CREATED` event
- Consume `BATCH_MORTALITY_RECORDED` (the current emitted event name) to recompute future injection-task bird counts
- Withdrawal sweep integration with batch FSM

### 2A.3 Feed Calculator Module Backend

Module path: file:artifacts/api-server/src/modules/feed/

Implements all endpoints from file:specs/04_FEED_CALCULATOR.md §5:

- `POST /api/v1/feed/optimize` (highs-js LP, 5s timeout, fallback)
- `POST /api/v1/feed/flexible`
- `POST /api/v1/feed/ready-made`
- `POST /api/v1/feed/concentrate-mix`
- `POST /api/v1/feed/:id/confirm` (publishes `FEED_FORMULATION_CONFIRMED`)
- `GET /api/v1/feed/batches/:batchId/history`
- `GET /api/v1/feed/ingredients`, `GET /api/v1/feed/requirements`

Key implementation details:

- Safety Preprocessor (file:artifacts/api-server/src/modules/feed/safety.ts) — 5 rules, duck niacin explicitly excluded (R-FC-5)
- The server validates the requested `phase` against the batch's canonical derived phase (species + current_week + duck_type). A mismatch is rejected; the API may not trust the client blindly for phase derivation.
- Nutritional requirement lookup is duck-type aware where `species = 'duck'`.
- LP solver (file:artifacts/api-server/src/modules/feed/lp.ts) — CPLEX-LP text format, `highs-js` WASM singleton
- Fallback: infeasible/timeout/error → Flexible Mix, HTTP 200 with `fallback_used: true`
- Fallback formulations must still satisfy mass-balance to `target_kg` within the documented tolerance.
- `FEED_FORMULATION_CONFIRMED` event published to outbox

## Sprint 2B — Phase 2 Backend: Stock + Finance

**Goal:** Stock and Finance modules are fully implemented, tested, and spec-compliant.

### 2B.1 DB Schema Extension — Stock + Finance

New Drizzle tables per file:specs/06_STOCK_MANAGEMENT.md §3 and file:specs/07_FINANCE.md §3:

- `suppliers`, `stock_lots`, `stock_allocations`
- `expense_entries`, `revenue_entries`

Migration path: keep legacy `stock_items`, `stock_transactions`, `expenses`, and `revenue` in place during backend-first delivery. Reuse or extend the current `stock_items` table only where it fits the new module; avoid rename-first migrations that would break the old pages before their replacements are ready.

### 2B.2 Stock Module Backend

Module path: file:artifacts/api-server/src/modules/stock/

Implements all endpoints from file:specs/06_STOCK_MANAGEMENT.md §5. Key implementation:

- FIFO + quality allocator (`allocateFifoByQuality`) per CONVENTIONS §2.15 — near-expiry bucket first, then expiry ASC, then received_at ASC; `damaged` grade excluded from auto-allocation
- Transitional table naming is acceptable while legacy pages remain live. The module may use a dedicated v2 stock-items table internally so long as the API contract stays canonical and legacy tables are left intact during backend-first delivery.
- `POST /api/v1/stock/purchases` publishes `STOCK_PURCHASED` → Finance auto-ledger
- `POST /api/v1/stock/availability` for Feed Calculator pre-LP check
- Event consumers: `HEALTH_TASK_COMPLETED` → auto-allocate medication stock (intensive only); `FEED_FORMULATION_CONFIRMED` → auto-allocate ingredient stock (intensive only)

### 2B.3 Finance Module Backend

Module path: file:artifacts/api-server/src/modules/finance/

Implements all endpoints from file:specs/07_FINANCE.md §5. Key implementation:

- Auto-ledger consumers for 6 events (STOCK_PURCHASED, HEALTH_TASK_COMPLETED, FEED_FORMULATION_CONFIRMED, BATCH_CREATED, EGG_SALE_RECORDED, BATCH_TERMINATED) — all idempotent on `(source_event, source_ref_id)`
- `BATCH_CREATED` auto-expense is conditional on the batch payload carrying the initial purchase cost. If no purchase cost is captured at batch creation, the farmer records the chick purchase manually.
- Cost privacy is server-side and per-user: the source of truth is `user_preferences.cost_privacy_enabled`, not a farm-wide flag.
- Masked financial fields are returned as `null` plus a privacy indicator; the API does not rely on client-side masking.
- The unmask grant must be persisted in the real auth session mechanism, not on a transient request-only object.
- P&L via SQL CTE (no client-side aggregation)
- Pattern gate: `auto:health` and `auto:feed` only for `production_system = 'intensive'`

## Sprint 2C — Phase 2 Frontend Rebuilds

**Goal:** All 4 Phase 2 frontend pages rebuilt as composed component trees against the new API endpoints. No file over ~250 lines. Phase 2+ mutating actions remain online-only until a command-intent outbox exists.

### 2C.1 Water-Health Page Rebuild

Replace file:artifacts/lampfarms/src/pages/Health.tsx (873 lines) with composed components:

- `BatchPicker` — select active batch
- `ConflictBanner` — surface C1–C8 BLOCK/WARN results
- `AddTaskDialog` — ad-hoc task creation with date + time input so hour-based conflicts can be evaluated correctly
- `VaccinationSchedule` — list with delivery-method-aware display (injection vs water)
- `MedicationLog` — task list with Complete/Skip actions; injection tasks hide container/dose UI
- `WaterRecords` — container picker + server-computed dose display using `computed_dose_amount` (never recalculated client-side)
- `WithdrawalTracker` — active withdrawal countdown
- `EggDiscardBanner` — shown when egg withdrawal active

```wireframe

<html>
<head>
<style>
body { font-family: sans-serif; margin: 0; padding: 16px; background: #f9f9f9; }
.header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.batch-picker { background: white; border: 1px solid #e0e0e0; border-radius: 8px; padding: 12px; margin-bottom: 12px; }
.conflict-banner { background: #fff3cd; border: 1px solid #ffc107; border-radius: 8px; padding: 12px; margin-bottom: 12px; font-size: 13px; }
.conflict-banner.block { background: #fde8e8; border-color: #dc3545; }
.tabs { display: flex; gap: 4px; margin-bottom: 12px; }
.tab { padding: 8px 16px; border-radius: 20px; border: 1px solid #e0e0e0; background: white; font-size: 13px; cursor: pointer; }
.tab.active { background: #000; color: white; border-color: #000; }
.task-card { background: white; border: 1px solid #e0e0e0; border-radius: 8px; padding: 12px; margin-bottom: 8px; }
.task-header { display: flex; justify-content: space-between; align-items: flex-start; }
.task-title { font-weight: 600; font-size: 14px; }
.badge { font-size: 11px; padding: 2px 8px; border-radius: 10px; background: #e8f5e9; color: #2e7d32; }
.badge.injection { background: #e3f2fd; color: #1565c0; }
.badge.blocked { background: #fde8e8; color: #c62828; }
.task-detail { font-size: 12px; color: #666; margin-top: 4px; }
.dose-box { background: #f5f5f5; border-radius: 6px; padding: 8px; margin-top: 8px; font-size: 12px; }
.actions { display: flex; gap: 8px; margin-top: 10px; }
.btn { padding: 6px 14px; border-radius: 20px; border: 1px solid #e0e0e0; font-size: 12px; cursor: pointer; background: white; }
.btn.primary { background: #000; color: white; border-color: #000; }
.withdrawal-bar { background: #fff3cd; border: 1px solid #ffc107; border-radius: 8px; padding: 10px 12px; margin-bottom: 12px; font-size: 13px; display: flex; justify-content: space-between; }
</style>
</head>
<body>
<div class="header">
  <h2 style="margin:0;font-size:20px;">Water & Health</h2>
  <button class="btn primary">+ Add Task</button>
</div>

<div class="batch-picker">
  <span style="font-size:12px;color:#666;">Active batch</span>
  <div style="font-weight:600;margin-top:2px;">Broiler Batch #12 · Week 4 · 490 birds</div>
</div>

<div class="conflict-banner block">
  ⛔ <strong>C4 BLOCKED:</strong> Gumboro vaccine scheduled — no antibiotics within 72 hours (until May 11)
</div>

<div class="withdrawal-bar">
  ⚠️ Withdrawal active · Oxytetracycline · Clears May 14 (meat) <span style="font-weight:600;">4 days remaining</span>
</div>

<div class="tabs">
  <div class="tab active">Tasks (5)</div>
  <div class="tab">Vaccinations</div>
  <div class="tab">Water Log</div>
  <div class="tab">Withdrawals</div>
</div>

<div class="task-card">
  <div class="task-header">
    <div class="task-title">Amprolium (CORID)</div>
    <span class="badge">Drinking water</span>
  </div>
  <div class="task-detail">Scheduled: May 8 · 5 days · Coccidiosis prevention</div>
  <div class="dose-box">
    Container: Jerry Can 25L × 2 = 50L<br>
    Dose: 1.0 tsp/gal × (50L / 3.785) = <strong>13.2 tsp</strong>
  </div>
  <div class="actions">
    <button class="btn primary">✓ Complete</button>
    <button class="btn">Skip</button>
  </div>
</div>

<div class="task-card">
  <div class="task-header">
    <div class="task-title">Duck Viral Hepatitis Vaccine</div>
    <span class="badge injection">Subcutaneous injection</span>
  </div>
  <div class="task-detail">Day 7 · Site: Back of neck · 0.5 ml/bird</div>
  <div class="dose-box">
    Birds: 100 · Total: 50 ml + 10% wastage<br>
    Manual administration — keep cold; remove water 2–3h before
  </div>
  <div class="actions">
    <button class="btn primary">✓ Mark Complete</button>
    <button class="btn">Record Reactions</button>
  </div>
</div>

<div class="task-card" style="opacity:0.6;">
  <div class="task-header">
    <div class="task-title">Enrofloxacin (Baytril)</div>
    <span class="badge blocked">BLOCKED — C5</span>
  </div>
  <div class="task-detail">Blocked: Fluoroquinolone + antibiotic combination prohibited</div>
</div>
</body>
</html>
```

### 2C.2 Feed Page Rebuild

Replace file:artifacts/lampfarms/src/pages/Feed.tsx + file:artifacts/lampfarms/src/pages/FeedFormulation.tsx + file:artifacts/lampfarms/src/components/feed/ with:

- `FeedMethodPicker` — 4 cards: Automatic (LP), Flexible, Ready-Made, Concentrate Mix
- `IngredientSelector` — multi-select with availability from Stock module
- `FormulationResult` — nutrition summary, cost breakdown, solver status badge
- `FallbackBanner` — shown when `solver_status = 'fallback'`
- `ConfirmToFeed` — confirm action that publishes `FEED_FORMULATION_CONFIRMED`

Duck niacin is **not** shown in any feed formulation UI — it is a Water-Health task.

### 2C.3 Stock Page Rebuild

Replace file:artifacts/lampfarms/src/pages/Stock.tsx (751 lines) with:

- `StockKPIs` — total value, low-stock count, expiring-soon count
- `ItemsTable` — filterable by category, shows lot count + on-hand
- `LotHistory` — per-item lot list with quality grade badges
- `PurchaseDialog` — new purchase with quality grade, expiry, supplier
- `LowStockAlerts` — items below reorder threshold

### 2C.4 Finance Page Rebuild

Replace file:artifacts/lampfarms/src/pages/Finance.tsx (758 lines) with:

- `FinanceKPIs` — total expenses, revenue, net profit, ROI (masked when privacy on)
- `ExpenseForm` + `ExpensesTable` — 9 categories, auto-entries marked read-only
- `RevenueForm` + `RevenueTable` — 5 revenue types
- `CategoryBreakdownChart` — pie/bar from server CTE
- `MonthlyTrendChart` — from server CTE
- `PrivacyToggle` — calls `POST /api/v1/finance/privacy/unmask`; never masks client-side

### 2C.5 BatchDetail Tabs Extension

Add Feed, Health, Performance, Expenses tabs to file:artifacts/lampfarms/src/pages/BatchDetail.tsx powered by the new Phase 2 endpoints.

## Sprint 3 — Phase 3: Multi-Species + Egg Production

**Goal:** Layer, duck (meat/layer), turkey species fully supported. Egg Production module live.

### 3.1 Batch FSM + Wizard Extension

- Duck Step 1b wizard (meat vs layer sub-type)
- Turkey cycle-length slider (12–20 weeks, default 16)
- Layer egg production enabled at Week 19+ (CONVENTIONS §2.1)
- Duck-layer egg production at Week 20+ (CONVENTIONS §2.7)
- Turkey FSM phase thresholds scale with `cycle_length_weeks` (percentage-based per file:specs/14_PROTOCOL_TURKEY.md §2.1)

### 3.2 Egg Production Module Backend

Module path: file:artifacts/api-server/src/modules/egg-production/

Implements all endpoints from file:specs/05_EGG_PRODUCTION.md §5:

- Daily collection with grade breakdown (S/M/L/XL/cracked/dirty)
- Inventory derived query (no stored table)
- Sales with `EGG_SALE_RECORDED` → Finance auto-revenue
- Withdrawal guard (R11 — sale blocked during active withdrawal)
- Eligibility guard (R1 — broiler/turkey/duck-meat return 404)

### 3.3 Species-Specific Water-Health Rules

- Duck niacin auto-task already in Sprint 1.2 — verify it fires correctly for duck-layer
- Turkey Metronidazole biweekly already in Sprint 1.2 — verify scaling with `cycle_length_weeks`
- Layer vaccination schedule (11 rearing vaccinations) seeded in Sprint 1.1

### 3.4 Eggs Page Rebuild

Replace file:artifacts/lampfarms/src/pages/Eggs.tsx (810 lines) with:

- `BatchPicker` (layer + duck-layer only)
- `ProductionHeader` — rate vs expected, week-over-week trend
- `CollectionDialog` — grade breakdown (S/M/L/XL/cracked/dirty)
- `SaleDialog` — crates + loose, price, buyer, payment method
- `RecordsTable` — daily collection history
- `SalesTable` — sale history with revenue
- `WeeklySummary` — production rate chart

## Sprint 4 — Phase 4: Records + Settings + PWA

**Goal:** Platform is feature-complete against the spec. Records analytics, Settings 5-tab UI, PWA, ops hardening.

### 4.1 Records Module Backend

Module path: file:artifacts/api-server/src/modules/records/

Implements all endpoints from file:specs/08_RECORDS.md §5:

- `GET /api/v1/records/overview` — aggregated KPIs
- `GET /api/v1/records/batches` — list with derived KPIs (CTE query)
- `GET /api/v1/records/batches/:id` — detail + weekly rows
- `GET /api/v1/records/batches/:id/activity` — UNION ALL timeline
- `POST /api/v1/records/compare` — 2–4 batches, insights
- `GET /api/v1/records/batches/:id/export` — PDF (`@react-pdf/renderer`) + CSV
- Cost privacy passthrough from Finance module

### 4.2 Dashboard Aggregator Backend

Module path: file:artifacts/api-server/src/modules/dashboard/

Implements `GET /api/v1/dashboard/overview` per file:specs/09_MAIN_DASHBOARD.md §6.6. Composes from internal services in a single handler. Response ≤ 400ms p95. Dashboard financial values follow the same server-side privacy rule as Finance and Records — masked responses return `null` plus a privacy indicator; unmasked values require an active grant.

### 4.3 Settings Module Backend

Module path: file:artifacts/api-server/src/modules/settings/

Per file:specs/10_SETTINGS.md (to be written in Sprint 0):

- User preferences (currency, timezone, cost-privacy PIN)
- Farm settings (name, location, water source chlorinated flag)
- Houses CRUD
- Market prices (L3 runtime config overrides)
- Species config viewer
- Data export / account deletion

Safety-key overrides rejected with `422 SAFETY_KEY_NOT_OVERRIDABLE`.

### 4.4 Records Page Rebuild

Replace file:artifacts/lampfarms/src/pages/Records.tsx (321 lines) with 4-tab layout per file:specs/08_RECORDS.md §5:

- Overview tab — KPI cards + trend charts
- Batches tab — list + detail + compare (2–4 batches)
- Health tab — task completion rates, withdrawal history
- Finance tab — proxies Finance P&L with same privacy rules

PDF/CSV export buttons wired to server-rendered endpoints.

### 4.5 Settings Page Rebuild

Replace file:artifacts/lampfarms/src/pages/SettingsPage.tsx (980 lines) with 5-tab layout per file:specs/10_SETTINGS.md:

- Profile tab
- Farm tab (name, location, houses, water source)
- Preferences tab (currency GHS/NGN only, timezone, cost-privacy PIN)
- Market Prices tab (L3 runtime overrides)
- Data tab (export, account deletion)

No password change UI. No USD/EUR/GBP currencies.

### 4.6 Dashboard Page Rebuild

Replace file:artifacts/lampfarms/src/pages/Dashboard.tsx with spec-compliant version consuming `GET /api/v1/dashboard/overview`. Dexie `dashboard_cache` table used for offline rendering. Cache stores exactly what the server returned at fetch time; when privacy is active and no grant exists, offline cache remains masked.

### 4.7 PWA + Mobile Polish

- Workbox `injectManifest` service worker
- PWA install banner
- Mobile bottom nav: 5 items — Home, Batches, Feed, Water-Health, Settings (per file:specs/09_MAIN_DASHBOARD.md §4)
- WCAG 2.1 AA audit on all primary pages

### 4.8 Ops Hardening

- Rate limiting on auth + write endpoints
- CORS allowlist for known origins
- `/healthz`, `/readyz`, `/metrics` already present — verify
- Outbox DLQ monitoring surface
- OpenAPI spec extended to cover all domain endpoints (currently auth-only)

## Sync Delta Extension (Cross-Sprint)

The `GET /api/sync/delta` endpoint currently covers 5 entities. Extend it as a **read-side cache feed** only. Existing Phase 1 offline writes may continue using the current outbox, but Phase 2+ command-style writes are online-only until a dedicated command-intent outbox is designed.

| Sprint | Entities added |
| --- | --- |
| 2A | `health_tasks`, `medications`, `formulations` |
| 2B | `stock_lots`, `expense_entries`, `revenue_entries` |
| 3 | `egg_collections`, `egg_sales` |
| 4 | `record_exports` |

## Test Coverage Requirements

Per spec rule: every business rule has a test. Minimum coverage per sprint:

| Sprint | Required tests |
| --- | --- |
| 0 | Vite starts locally; auth bypass returns 200; cookie not set on http |
| 1 | Species config seeds load; daily task job generates correct tasks for broiler Day 7; withdrawal sweep clears correctly |
| 2A | All C1–C8 conflict scenarios; dosing formula for all 9 containers; LP optimal + infeasible + timeout paths; duck formulation has no niacin line |
| 2B | FIFO+quality allocation across overlapping lots; damaged lot excluded; auto-ledger idempotency; cost privacy masking |
| 2C | Frontend renders without errors against real endpoints; conflict banner shown on BLOCK; offline mutating actions show reconnect guidance |
| 3 | Layer Week 18 rejected, Week 19 accepted; duck-layer Week 20; EGG_SALE_RECORDED produces revenue row |
| 4 | CTE query plan has no Materialize node; PDF export returns %PDF magic bytes; dashboard privacy matches Finance/Records server-side masking; PWA installs on Chrome |
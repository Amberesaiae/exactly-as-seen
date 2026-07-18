# T3 — Schema Correctness: Finance, Stock, Egg, Feed Table Fixes

## Overview

Fix live code vs spec mismatches that cause incorrect data and silent analytics failures. Also document the `batch_tasks` and `water_records` tables in the canonical specs, add vaccination anti-stress auto-scheduling, and fix the medication stock deduction unit conversion.

**Source:** `spec:8defac00-3b0b-4081-8337-151887bd3118` — Gaps A, B, E, H6, H7, H8, H9, H10
**Ground-truth verified against:** file:exactly-as-seen/src/hooks/useHealthData.ts, file:exactly-as-seen/src/hooks/useFinanceData.ts, file:exactly-as-seen/src/hooks/useStockData.ts, file:exactly-as-seen/supabase/migrations/20260525000000_fourth_sprint.sql

**Already closed (no action needed):**

- Gap C (stock quality grade) — `20260525000000_fourth_sprint.sql` M1+M2 ✅
- Gap D (`egg_records` rename) — `20260525000000_fourth_sprint.sql` M3 ✅

## Scope

### Fix B — Finance: Expense Category Strings + Revenue `amount_pesewas`

**Root cause (confirmed from live code):**

- `useHealthData.ts` line 458: `category: 'medication'` — non-canonical. Canonical `07_FINANCE.md` §2.1 defines `'health_and_medicine'`.
- `useStockData.ts` lines 144–153: category mapping uses non-canonical strings:
  - `'feed_purchase'` → should be `'feed_and_nutrition'`
  - `'medications'` → should be `'health_and_medicine'`
  - `'chicks_and_birds'` → already correct ✅
  - `'equipment'` → should be `'equipment_and_tools'`
  - `'other'` → should be `'other_expenses'`
- `useFinanceData.ts` line 73: reads `Number(e.amount_pesewas ?? 0) / 100` — **already correct** ✅
- `useFinanceData.ts` `addExpense()` line 142: inserts `amount_pesewas: Math.round(Number(data.amount) * 100)` — **already correct** ✅
- `useFinanceData.ts` `addRevenue()` line 168: inserts `amount: data.amount` (GHS float) — should be `amount_pesewas: Math.round(Number(data.amount) * 100)`

**Fix:**

- `useHealthData.ts` line 458: `category: 'medication'` → `category: 'health_and_medicine'`
- `useStockData.ts` lines 144–153: update category mapping to canonical strings (see Tech Plan §6.1)
- `useFinanceData.ts` `addRevenue()` line 168: `amount: data.amount` → `amount_pesewas: Math.round(Number(data.amount) * 100)` (remove `amount` field)
- **After frontend deploy:** Apply Migration 5B to drop `expenses.amount` column

### Fix C — Stock Quality Grade

**Status: CLOSED** — `20260525000000_fourth_sprint.sql` M1+M2 already applied the data fix and CHECK constraint. `useStockData.ts` line 109 already inserts `quality_grade: 'A'` ✅. No action needed.

### Fix D — `egg_records` → `egg_collections`

**Status: CLOSED** — `20260525000000_fourth_sprint.sql` M3 already renamed the table and recreated both Postgres functions ✅.

**Remaining code work:** Update `useEggData.ts` lines 58, 177, 191: `supabase.from('egg_records')` → `supabase.from('egg_collections')`. Regenerate `types.ts` from DB.

### Fix E — `feed_schedules` Spec + Records CTE Fix

**Root cause (confirmed from live code):**

- `Feed.tsx` lines 63–69: reads from `feed_schedules` — confirmed live table name
- `Feed.tsx` lines 159–168: inserts with columns `farm_id`, `batch_id`, `week`, `day`, `amount_per_bird_g`, `total_amount_kg`, `completed`, `completed_at` — confirmed live column names
- `batch-utils.ts` lines 105–108: `cleanupBatchCompletion` updates `feed_schedules` — confirmed
- Migration line 336: `get_batch_record_summary` queries `feed_schedules.total_amount_kg` — **already correct in the live Postgres function** ✅
- `08_RECORDS.md` §5.3 CTE lines 232–235: uses `FROM feed_consumption` and `consumed_kg` — **wrong in the spec** (both table name and column name)

**Fix (spec-only — no migration needed):**

- file:exactly-as-seen/specs/04_FEED_CALCULATOR.md: Add §3.1 documenting `feed_schedules` table with confirmed columns
- file:exactly-as-seen/specs/08_RECORDS.md §5.3 CTE: Change `FROM feed_consumption` → `FROM feed_schedules` and `consumed_kg` → `total_amount_kg`

**No migration needed** — the live `get_batch_record_summary` Postgres function already uses `feed_schedules.total_amount_kg` correctly.

### Fix A — `batch_tasks` Table Documentation

**Root cause (confirmed from live code):**

- `types.ts` lines 79–135: `batch_tasks` table fully defined with columns `id`, `batch_id`, `farm_id`, `title`, `description`, `due_date`, `task_type`, `completed`, `completed_at`, `created_at`, `updated_at`
- Migration lines 4–6: unique constraint `(batch_id, due_date, task_type)` — confirmed
- Migration lines 128–172: `cron_generate_daily_tasks()` inserts `feed_log`, `water_log`, `egg_collection` tasks — confirmed
- Migration lines 229–231: `get_dashboard_overview` counts from both `batch_tasks` AND `health_tasks` — confirmed
- No canonical spec documents this table

**Fix (spec-only — no migration needed):**

- file:exactly-as-seen/specs/10_CORE_FLOWS.md: Add a new section documenting `batch_tasks` table covering:
  - Schema (all columns from `types.ts` lines 79–135)
  - `task_type` enum: `'feed_log' | 'water_log' | 'egg_collection'`
  - Unique constraint: `(batch_id, due_date, task_type)`
  - Generation: `cron_generate_daily_tasks()` at 06:00 farm timezone (pg_cron: `'0 * * * *'`)
  - Conditions: `egg_collection` only for layer Week 19+, duck-layer Week 20+
  - Relationship to `health_tasks`: parallel systems, both counted in dashboard `tasks_today_count`
  - Completion: individual per-task (not bulk-completable)

## Acceptance Criteria

**Fix B (Finance category strings + revenue):**
`useHealthData.ts` expense upsert uses `category: 'health_and_medicine'` (not `'medication'`)
`useStockData.ts` category mapping uses canonical strings from `07_FINANCE.md` §2.1
`useFinanceData.ts` `addRevenue()` inserts `amount_pesewas` (not `amount` GHS float)

**Fix C (Stock quality grade):** CLOSED ✅ — already applied via `fourth_sprint.sql`

**Fix D (Egg records rename):** CLOSED ✅ — migration already applied; `useEggData.ts` updated to use `egg_collections`

**Fix E (Feed schedules):**
`04_FEED_CALCULATOR.md` §3.1 documents `feed_schedules` table with correct column names
`08_RECORDS.md` §5.3 CTE uses `FROM feed_schedules` and `total_amount_kg`

**Fix A (batch_tasks):**
`10_CORE_FLOWS.md` documents `batch_tasks` table schema, `task_type` enum, generation cadence, and relationship to `health_tasks`

**Fix H6/H7 (water_records spec):**
`03_WATER_HEALTH.md` §3.4 documents `water_records` table schema, water consumption rates per species/week, and heat stress multipliers

**Fix H9 (vaccination anti-stress auto-scheduling):**
After `markVaccineAdministered()` succeeds, 3 new `health_tasks` rows are inserted (anti-stress tomorrow, anti-stress day after, multivitamins day after)
Auto-scheduling is idempotent (duplicate inserts ignored)
Toast confirms: "Vaccine administered. Anti-stress tasks scheduled for next 2 days."

**Fix H10 (medication stock deduction unit conversion):**
`markTaskComplete()` uses `convertDoseToStockUnit()` to convert `computed_dose_amount` from `dose_unit` to the stock item's `unit` before deducting
Deducting `9.9 tsp` from a stock item in `ml` correctly converts to `~48.8 ml`

## Files to Change

**Code fixes:**

- file:exactly-as-seen/src/hooks/useHealthData.ts (Fix B: `category: 'medication'` → `'health_and_medicine'` at line 458; Fix H9: add anti-stress auto-scheduling after `markVaccineAdministered`; Fix H10: add `convertDoseToStockUnit()` helper and use it at line 429)
- file:exactly-as-seen/src/hooks/useStockData.ts (Fix B: update category mapping at lines 144–153 to canonical strings)
- file:exactly-as-seen/src/hooks/useFinanceData.ts (Fix B: `addRevenue()` line 168 → `amount_pesewas: Math.round(Number(data.amount) * 100)`)
- file:exactly-as-seen/src/hooks/useEggData.ts (Fix D: `egg_records` → `egg_collections` at lines 58, 177, 191)
- file:exactly-as-seen/src/integrations/supabase/types.ts (Fix D: regenerate after migration)

**Spec fixes (no migration):**

- file:exactly-as-seen/specs/03_WATER_HEALTH.md (Fix H6/H7: add §3.4 `water_records` table + water consumption rates + heat stress multipliers)
- file:exactly-as-seen/specs/04_FEED_CALCULATOR.md (Fix E: add §3.1 `feed_schedules` table definition)
- file:exactly-as-seen/specs/08_RECORDS.md (Fix E: CTE `feed_consumption`/`consumed_kg` → `feed_schedules`/`total_amount_kg`)
- file:exactly-as-seen/specs/10_CORE_FLOWS.md (Fix A: add `batch_tasks` documentation)

**No new migrations needed** — M1–M5 already applied via `20260525000000_fourth_sprint.sql`. M6 (drop `expenses.amount`) runs after this ticket's frontend fixes are deployed.

**No changes needed:**

- file:exactly-as-seen/supabase/functions/generate-daily-tasks/index.ts (no direct `egg_records` reference)
- file:exactly-as-seen/specs/05_EGG_PRODUCTION.md (already correct)
- file:exactly-as-seen/src/hooks/useFinanceData.ts `addExpense()` (already correct ✅)
- file:exactly-as-seen/src/hooks/useFinanceData.ts stats computation (already correct ✅)
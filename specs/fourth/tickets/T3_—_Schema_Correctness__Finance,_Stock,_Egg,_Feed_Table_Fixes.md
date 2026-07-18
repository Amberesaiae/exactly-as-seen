# T3 — Schema Correctness: Finance, Stock, Egg, Feed Table Fixes

## Overview

Fix five live code vs spec mismatches that cause incorrect data and silent analytics failures. These are prerequisite fixes for the feature work in T1 and T2. Also document the `batch_tasks` table in the canonical specs.

**Source:** `spec:8defac00-3b0b-4081-8337-151887bd3118` — Gaps A, B, C, D, E
**Ground-truth verified against:** file:exactly-as-seen/src/integrations/supabase/types.ts, file:exactly-as-seen/supabase/migrations/20260414080005_rpc_and_jobs.sql, all affected hooks

## Scope

### Fix B — Finance: `amount` vs `amount_pesewas`

**Root cause (confirmed from live code):**

- `types.ts` lines 408–464: `expenses` table has BOTH `amount: number` (default 0) AND `amount_pesewas: number | null` — Migration 5B has NOT been applied to the live DB yet
- `useHealthData.ts` line 412: `amount: costPesewas / 100` — writes GHS float to `amount`
- `useHealthData.ts` line 413: `amount_pesewas: costPesewas` — writes pesewas integer to `amount_pesewas`
- `useStockData.ts` line 160: `amount: totalPesewas / 100` — writes GHS float to `amount`
- `useStockData.ts` line 161: `amount_pesewas: totalPesewas` — writes pesewas integer to `amount_pesewas`
- `useFinanceData.ts` line 73: `Number(e.amount)` — reads GHS float (wrong unit for pesewas-based calculations)
- `useFinanceData.ts` lines 83–86, 89–93, 107–115, 121–124: all use `Number(e.amount)` / `Number(r.amount)`
- `useFinanceData.ts` `addExpense` (lines 138–162): inserts `amount: data.amount` without `amount_pesewas` — additional bug

**Fix:**

- `useHealthData.ts` line 412: Remove `amount: costPesewas / 100`
- `useStockData.ts` line 160: Remove `amount: totalPesewas / 100`
- `useFinanceData.ts` line 73: `Number(e.amount)` → `Number(e.amount_pesewas ?? 0) / 100`
- `useFinanceData.ts` lines 83–86, 89–93, 107–115, 121–124: Update all `Number(e.amount)` / `Number(r.amount)` → `Number(e.amount_pesewas ?? 0) / 100` / `Number(r.amount_pesewas ?? 0) / 100`
- `useFinanceData.ts` `addExpense`: Add `amount_pesewas: Math.round(Number(data.amount) * 100)` to the insert
- **After frontend deploy:** Apply Migration 5B to drop `expenses.amount` column

### Fix C — Stock: `quality_grade: 'good'` → `'A'`

**Root cause (confirmed from live code):**

- `useStockData.ts` line 109: `quality_grade: 'good'` — confirmed
- `allocate_fifo_by_quality` RPC (migration lines 396–407): excludes `quality_grade = 'damaged'` but does not validate enum — `'good'` lots are allocated without error
- No CHECK constraint exists on `stock_lots.quality_grade` in the live schema

**Fix:**

- `useStockData.ts` line 109: `quality_grade: 'good'` → `quality_grade: 'A'`
- New migration (run BEFORE frontend deploy):

```sql
UPDATE public.stock_lots SET quality_grade = 'A' WHERE quality_grade = 'good';
ALTER TABLE public.stock_lots
  ADD CONSTRAINT stock_lots_quality_grade_check
  CHECK (quality_grade IN ('A', 'B', 'C', 'damaged'));
```

### Fix D — `egg_records` → `egg_collections` DB + Code Alignment

**Root cause (confirmed from live code):**

- `types.ts` lines 273–329: `egg_records` table definition — this IS the live DB table name
- `useEggData.ts` line 58: `supabase.from('egg_records')` — confirmed
- `useEggData.ts` line 177: duplicate check queries `egg_records` — confirmed
- `useEggData.ts` line 191: insert into `egg_records` — confirmed
- Migration line 337: `get_batch_record_summary` queries `public.egg_records` — confirmed
- Migration lines 360–362: `get_egg_inventory` queries `public.egg_records` — confirmed
- `generate-daily-tasks/index.ts`: calls `cron_generate_daily_tasks()` RPC only — **no direct ****`egg_records`**** reference** (no change needed here)
- `05_EGG_PRODUCTION.md` §3: `pgTable('egg_collections', ...)` — already correct ✅
- `08_RECORDS.md` §5.3 CTE: uses `egg_collections` — already correct ✅

**Fix (atomic — migration + code must deploy together):**

New migration:

```sql
-- Step 1: Rename table
ALTER TABLE public.egg_records RENAME TO egg_collections;

-- Step 2: Recreate get_batch_record_summary (update line 337: egg_records → egg_collections)
CREATE OR REPLACE FUNCTION public.get_batch_record_summary(
  p_farm_id UUID,
  p_batch_ids UUID[]
) RETURNS TABLE (...) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY SELECT ...
    COALESCE((SELECT SUM(total_eggs)::INTEGER FROM public.egg_collections  -- changed
      WHERE egg_collections.batch_id = b.id AND egg_collections.farm_id = p_farm_id), 0) AS total_eggs,
    ...
END;
$$;

-- Step 3: Recreate get_egg_inventory (update lines 360–362: egg_records → egg_collections)
CREATE OR REPLACE FUNCTION public.get_egg_inventory(
  p_batch_id UUID,
  p_farm_id UUID
) RETURNS INTEGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  SELECT COALESCE(SUM(good), 0) INTO v_collected
  FROM public.egg_collections  -- changed
  WHERE batch_id = p_batch_id AND farm_id = p_farm_id;
  ...
END;
$$;
```

Code changes (deploy atomically with migration):

- file:exactly-as-seen/src/hooks/useEggData.ts lines 58, 177, 191: `supabase.from('egg_records')` → `supabase.from('egg_collections')`
- file:exactly-as-seen/src/integrations/supabase/types.ts: Regenerate from DB after migration (rename `egg_records` → `egg_collections` in the type definition)

**No changes needed:**

- file:exactly-as-seen/supabase/functions/generate-daily-tasks/index.ts (no direct table reference)
- file:exactly-as-seen/specs/05_EGG_PRODUCTION.md (already correct)
- file:exactly-as-seen/specs/08_RECORDS.md (already correct)

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

**Fix B (Finance):**
`useFinanceData.ts` `stats.totalExp` is computed from `amount_pesewas / 100` (not `amount` GHS float)
`useHealthData.ts` expense upsert does NOT include `amount: costPesewas / 100`
`useStockData.ts` expense upsert does NOT include `amount: totalPesewas / 100`
`useFinanceData.ts` `addExpense` includes `amount_pesewas: Math.round(Number(data.amount) * 100)`

**Fix C (Stock):**
New stock lot purchases insert `quality_grade: 'A'` (not `'good'`)
Existing `'good'` rows in `stock_lots` are updated to `'A'` via migration
`stock_lots` has CHECK constraint `quality_grade IN ('A', 'B', 'C', 'damaged')`

**Fix D (Egg records):**
`egg_records` table is renamed to `egg_collections` via migration
`useEggData.ts` queries `egg_collections` (not `egg_records`)
`get_batch_record_summary` Postgres function queries `egg_collections`
`get_egg_inventory` Postgres function queries `egg_collections`
`generate-daily-tasks/index.ts` requires no changes (no direct table reference)
`05_EGG_PRODUCTION.md` and `08_RECORDS.md` require no changes (already correct)

**Fix E (Feed schedules):**
`04_FEED_CALCULATOR.md` §3.1 documents `feed_schedules` table with correct column names
`08_RECORDS.md` §5.3 CTE uses `FROM feed_schedules` and `total_amount_kg` (not `feed_consumption` / `consumed_kg`)
No migration needed (live Postgres function already correct)

**Fix A (batch_tasks):**
`10_CORE_FLOWS.md` documents `batch_tasks` table schema, `task_type` enum, generation cadence, and relationship to `health_tasks`

## Files to Change

**Code fixes:**

- file:exactly-as-seen/src/hooks/useHealthData.ts (Fix B: remove `amount: costPesewas/100` from line 412)
- file:exactly-as-seen/src/hooks/useStockData.ts (Fix B: remove `amount: totalPesewas/100` from line 160; Fix C: `quality_grade: 'A'` at line 109)
- file:exactly-as-seen/src/hooks/useFinanceData.ts (Fix B: all `Number(e.amount)` → `Number(e.amount_pesewas ?? 0) / 100`; add `amount_pesewas` to `addExpense`)
- file:exactly-as-seen/src/hooks/useEggData.ts (Fix D: `egg_records` → `egg_collections` at lines 58, 177, 191)
- file:exactly-as-seen/src/integrations/supabase/types.ts (Fix D: regenerate after migration — rename `egg_records` → `egg_collections`)

**Spec fixes (no migration):**

- file:exactly-as-seen/specs/04_FEED_CALCULATOR.md (Fix E: add §3.1 `feed_schedules` table definition)
- file:exactly-as-seen/specs/08_RECORDS.md (Fix E: CTE `feed_consumption`/`consumed_kg` → `feed_schedules`/`total_amount_kg`)
- file:exactly-as-seen/specs/10_CORE_FLOWS.md (Fix A: add `batch_tasks` documentation)

**Migrations (new file):**

- M1+M2: stock quality grade data fix + CHECK constraint (run before frontend)
- M3: `ALTER TABLE egg_records RENAME TO egg_collections` + recreate `get_batch_record_summary` + `get_egg_inventory` (atomic with `useEggData.ts` deploy)

**No changes needed:**

- file:exactly-as-seen/supabase/functions/generate-daily-tasks/index.ts (no direct `egg_records` reference)
- file:exactly-as-seen/specs/05_EGG_PRODUCTION.md (already correct)
- file:exactly-as-seen/specs/08_RECORDS.md egg table references (already uses `egg_collections`)
# Epic Brief — Feed Task Allocation & Water-Health Weekly Task Plan

# Epic Brief — Feed Task Allocation & Water-Health Weekly Task Plan

**Epic:** epic:8defac00-3b0b-4081-8337-151887bd3118
**Status:** Approved for implementation
**Stack:** TypeScript / React 19 / Supabase (Postgres + Edge Functions) / Dexie.js / shadcn/ui
**Ground-truth verified:** All claims below are confirmed against live source files, migrations, and canonical specs.

## 1. Problem Statement

LampFarms farmers currently have no structured way to know **how much feed to prepare this week** or **what water-health tasks are due this week**. The system generates health tasks and tracks feed consumption, but it does not surface these as a coherent, actionable weekly plan.

Specifically:

1. **Feed:** The `Feed.tsx` page shows `dailyTotalKg = feedPerBirdG × birds / 1000` as a display-only number. The farmer must mentally multiply by 7 to know the weekly requirement, then manually enter `target_kg` in the formulation flow with no guidance. There is no "plan for X days/weeks" step.
2. **Water-Health:** The `health_tasks` table generates medication and vaccination tasks correctly, and `batch_tasks` generates daily `feed_log`, `water_log`, and `egg_collection` tasks. But the farmer has no consolidated **"This Week's Tasks"** view — only a flat list filtered by `?week=N`. There is no weekly summary, no upcoming-week preview, and no bulk-complete action.

## 2. Evidence from Deprecated Docs & Live Code

The deprecated `docs/Lampfarms specs/specs/Feed_Calculator_System_...md` labels the planning step the **"CRITICAL Foundation"** and defines:

<user_quoted_section>Option B: Plan by Duration — target_kg = (daily_intake_g × bird_count × duration_days) / 1000</user_quoted_section>

The deprecated `docs/priest new/specs/Water-Health_System_...md` Wireframe 2 defines a **"This Week's Tasks (Week 4)"** dashboard with task cards, a **"Complete All Pending Tasks"** bulk action, and an **"Upcoming Tasks (Week 5)"** preview section, with the note: *"Dashboard shows weekly tasks (not just today), with upcoming week preview."*

The deprecated `docs/flows/06-weekly-advisor-flow.md` defines a `GET /batches/{batch_id}/weekly-summary/{week}` endpoint returning `{ health_tasks_completed, health_tasks_pending, feed_consumed_kg, next_week_tasks }`.

**Live code confirms:**

- file:exactly-as-seen/src/pages/FeedFormulation.tsx line 20: `type FeedMethod = 'select' | 'ready_made' | 'custom' | 'concentrate'` — no `'plan'` step exists
- file:exactly-as-seen/src/pages/Feed.tsx line 77: `dailyTotalKg = phase.feedPerBirdG × batch.current_population / 1000` — display only, no weekly planning
- file:exactly-as-seen/src/pages/Health.tsx lines 101–118: 3 tabs only (`Vaccines | Meds | Water`) — no "This Week" tab
- file:exactly-as-seen/supabase/migrations/20260414080005_rpc_and_jobs.sql lines 149–167: `cron_generate_daily_tasks()` inserts into `batch_tasks` — confirmed live
- file:exactly-as-seen/supabase/migrations/20260414080005_rpc_and_jobs.sql lines 229–231: dashboard counts from both `batch_tasks` AND `health_tasks` — confirmed live
- file:exactly-as-seen/src/integrations/supabase/types.ts lines 273–329: `egg_records` table is the live DB table name (not `egg_collections`)
- file:exactly-as-seen/src/integrations/supabase/types.ts lines 408–464: `expenses` table has BOTH `amount: number` AND `amount_pesewas: number | null` — Migration 5B has NOT dropped `amount` yet in the live types
- file:exactly-as-seen/src/hooks/useHealthData.ts lines 407–417: inserts `amount: costPesewas / 100` AND `amount_pesewas: costPesewas` — dual-column write confirmed
- file:exactly-as-seen/src/hooks/useFinanceData.ts line 73: reads `Number(e.amount)` — reads GHS float, not pesewas
- file:exactly-as-seen/src/hooks/useStockData.ts line 109: inserts `quality_grade: 'good'` — confirmed
- file:exactly-as-seen/supabase/functions/advance-batch-weeks/index.ts: calls `cron_advance_batch_weeks()` RPC — returns only `{ success, message }`, no phase change details
- file:exactly-as-seen/supabase/functions/push-alerts/index.ts line 27: only fires on `mortality_records` INSERT — confirmed

## 3. Live System Gaps (Confirmed from Source)

### Feed Gaps

| Gap | Evidence |
| --- | --- |
| **F1** — No "plan by duration" step before formulation | `FeedFormulation.tsx` goes straight to method selection; farmer enters `target_kg` raw |
| **F2** — `feed_schedules` table is live but unspecced | `Feed.tsx` reads/writes `feed_schedules`; `08_RECORDS.md` CTE references `feed_consumption` (different name) |
| **F3** — `feedPerBirdG` rates are client-side only | `feed-data.ts` has rates; `nutritional_requirements` table has no `feed_per_bird_g` column |
| **F4** — `AdvanceWeekResponse` missing feed transition fields | `02_BATCH_MANAGEMENT.md` §5.4 only has `{ batch, phase_changed, previous_phase }` |
| **F5** — Semi-intensive foraging modifiers not applied | `Feed.tsx` uses `feedPerBirdG` directly; no modifier logic exists |
| **F6** — Feed allocation behaviour (intensive auto vs semi manual) not documented | `04_FEED_CALCULATOR.md` mentions `production_system` in events but never specifies the allocation behaviour |

### Water-Health Gaps

| Gap | Evidence |
| --- | --- |
| **H1** — No weekly task plan view | `03_WATER_HEALTH.md` only has `GET /tasks?week=N` flat list; no plan object, no aggregate stats |
| **H2** — No bulk complete endpoint | Not in `03_WATER_HEALTH.md` §5 |
| **H3** — No vaccination protocol checklist | `CompleteTaskInput` has `cost_pesewas` + `notes` only |
| **H4** — No weekly summary with `next_week_tasks` | Not in any current spec |
| **H5** — Traditional remedies mentioned in scope but unspecced | `03_WATER_HEALTH.md` §1 lists them; no `remedy_type` field, no dosing rules |

### Schema Correctness Gaps

| Gap | Evidence |
| --- | --- |
| **A** — `batch_tasks` table entirely unspecced | `cron_generate_daily_tasks()` (migration line 149) inserts into `batch_tasks`; `get_dashboard_overview` (migration lines 229–231) counts from both `batch_tasks` AND `health_tasks`; no canonical spec documents this table |
| **B** — Finance dual-column bug | `useHealthData.ts` lines 407–417 inserts `amount: costPesewas/100` AND `amount_pesewas: costPesewas`; `useStockData.ts` lines 155–165 does the same; `useFinanceData.ts` line 73 reads `Number(e.amount)` (GHS float); live `types.ts` confirms `expenses` table still has both columns — Migration 5B has not yet been applied to the live schema |
| **C** — Stock `quality_grade: 'good'` vs canonical `'A'\|'B'\|'C'\|'damaged'` | `useStockData.ts` line 109 inserts `quality_grade: 'good'`; `06_STOCK_MANAGEMENT.md` §2.2 defines `QualityGrade = 'A'\|'B'\|'C'\|'damaged'`; `allocate_fifo_by_quality` RPC (migration lines 396–407) excludes `'damaged'` but `'good'` is not in the canonical enum |
| **D** — `egg_records` (live DB table name) vs `egg_collections` (canonical spec table name) | `useEggData.ts` line 58 reads `public.egg_records`; `get_egg_inventory` RPC (migration lines 360–362) queries `egg_records`; `get_batch_record_summary` (migration line 337) queries `egg_records`; live `types.ts` lines 273–329 confirms `egg_records` is the live table; but `05_EGG_PRODUCTION.md` §3 Drizzle schema defines `pgTable('egg_collections', ...)` and `08_RECORDS.md` §5.3 CTE uses `egg_collections` — canonical spec is the source of truth; live DB and code must be renamed |
| **E** — `feed_schedules` (live) vs `feed_consumption` (spec CTE name) + `total_amount_kg` (live column) vs `consumed_kg` (spec CTE column) | `get_batch_record_summary` (migration line 336) queries `feed_schedules.total_amount_kg` correctly; but `08_RECORDS.md` §5.3 CTE uses `FROM feed_consumption` and `consumed_kg` — both the table name and column name are wrong in the spec CTE |

## 4. Scope

### In Scope

**Feature Work (new user-facing capabilities):**

1. **Feed Planning Step** — Add `'plan'` to `FeedMethod` in `FeedFormulation.tsx`. Before any formulation method, the farmer sets a planning horizon: "Plan for X days" or "Plan for X weeks." The system auto-computes `target_kg = feedPerBirdG × current_quantity × duration_days / 1000` using `feedPerBirdG` from `feed-data.ts` (client-side, no new API call). The result pre-fills `target_kg` in the existing method components (`ReadyMadeFeed`, `CustomFormulation`, `ConcentrateMix`). The farmer also sees "≈ N bags of 50 kg."
2. **Feed Phase Transition Prompt** — When `Feed.tsx` detects that the current phase's `feedPerBirdG` differs from the last `feed_schedules` row's `amount_per_bird_g`, show a dismissible alert card prompting the farmer to plan the new phase's feed. Client-side comparison — no new API call.
3. **Weekly Health Task Plan View** — Add a **"This Week"** tab (4th tab, leftmost) to `Health.tsx` alongside the existing `Vaccines | Meds | Water` tabs. Shows all `health_tasks` and `batch_tasks` for the current week with aggregate stats (`tasks_total`, `tasks_completed`, `tasks_pending`, `estimated_cost_pesewas`) and an "Upcoming Tasks (Week N+1)" preview.
4. **Bulk Complete Health Tasks** — A "Complete All Pending Tasks" action that marks all pending `health_tasks` for the current week as completed in a single RPC call. `batch_tasks` (feed_log, water_log, egg_collection) are excluded — they require individual completion with a quantity.
5. **Weekly Summary RPC** — New Postgres function `get_weekly_health_summary(p_batch_id, p_week_number, p_farm_id)` returning `{ health_tasks_total, health_tasks_completed, health_tasks_pending, batch_tasks_total, batch_tasks_completed, total_health_cost_pesewas, next_week_tasks[] }`.
6. **Bulk Complete RPC** — New Postgres function `bulk_complete_health_tasks(p_batch_id, p_week_number, p_farm_id, p_completed_at)` returning `{ completed_count, skipped_count, task_ids[] }`.

**Schema Correctness Work (prerequisite fixes):**

1. **`batch_tasks`**** table spec** — Document the `batch_tasks` table in file:exactly-as-seen/specs/10_CORE_FLOWS.md. Live schema confirmed from `types.ts` lines 79–135: columns are `id`, `batch_id`, `farm_id`, `title`, `description`, `due_date`, `task_type`, `completed`, `completed_at`, `created_at`, `updated_at`.
2. **Finance pesewas fix** — Fix `useHealthData.ts` (remove `amount: costPesewas / 100`), `useStockData.ts` (remove `amount: totalPesewas / 100`), `useFinanceData.ts` (change `Number(e.amount)` → `Number(e.amount_pesewas) / 100`). Note: live `types.ts` confirms `expenses.amount` column still exists — Migration 5B has not been applied; the fix is frontend-only until Migration 5B runs.
3. **Stock quality grade** — Fix `useStockData.ts` line 109: `quality_grade: 'good'` → `quality_grade: 'A'`. Add migration: `UPDATE stock_lots SET quality_grade = 'A' WHERE quality_grade = 'good'` + CHECK constraint.
4. **`egg_records`**** → ****`egg_collections`**** alignment** — The canonical spec (`05_EGG_PRODUCTION.md` §3) defines `pgTable('egg_collections', ...)`. The live DB table is `egg_records` (confirmed from `types.ts` lines 273–329 and migration lines 337, 360–362). Fix: migration `ALTER TABLE egg_records RENAME TO egg_collections`; update `useEggData.ts`, `get_batch_record_summary` function, and `get_egg_inventory` function. **Specs ****`05_EGG_PRODUCTION.md`**** and ****`08_RECORDS.md`**** are already correct — no spec changes needed.**
5. **`feed_schedules`**** spec + Records CTE fix** — Document `feed_schedules` table in `04_FEED_CALCULATOR.md` §3.1. Fix `08_RECORDS.md` §5.3 CTE: change `FROM feed_consumption` → `FROM feed_schedules` and `consumed_kg` → `total_amount_kg`. Note: the live `get_batch_record_summary` Postgres function (migration line 336) already uses `feed_schedules.total_amount_kg` correctly — only the spec CTE needs updating.

### Out of Scope

- Traditional remedies per-task `remedy_type` choice (deferred — mentioned in scope in `03_WATER_HEALTH.md` §1 but no deprecated spec has a complete enough design to implement safely)
- Semi-intensive foraging modifiers (deferred — requires vet sign-off on modifier values)
- Push notifications beyond mortality alert (separate epic)
- Offline outbox conflict resolution for C1–C8 (separate epic)
- `feed_plan_cadence` preference in Settings (deferred — the planning step UI handles both per-week and per-phase naturally without a stored preference)

## 5. Success Criteria

| # | Criterion |
| --- | --- |
| SC-1 | Farmer can enter "Plan for 2 weeks" on the Feed page and see `target_kg` auto-computed as `feedPerBirdG × birds × 14 / 1000` with a bag count estimate |
| SC-2 | When a batch advances to a new phase, the UI shows a feed transition prompt with the new phase's consumption rate |
| SC-3 | The Health page shows a "This Week's Tasks" section with all tasks for the current week, aggregate stats, and an upcoming week preview |
| SC-4 | "Complete All Pending Tasks" marks all pending health tasks for the week as completed in one action |
| SC-5 | `GET /health/batches/:batchId/weeks/:week/summary` returns correct `health_tasks_completed`, `health_tasks_pending`, and `next_week_tasks` |
| SC-6 | `batch_tasks` table is documented in the canonical specs |
| SC-7 | Finance stats are computed from `amount_pesewas` (not `amount` GHS float) |
| SC-8 | Stock lots are inserted with `quality_grade: 'A'` (not `'good'`) |
| SC-9 | `egg_records` and `egg_collections` are aligned (one canonical name) |
| SC-10 | `feed_schedules` is documented in `04_FEED_CALCULATOR.md` and the Records CTE uses the correct table name |

## 6. Constraints

- **No new tables** for the feed planning step — `feed_schedules` already exists and is the correct table for logging actual consumption. The planning step is a UI computation that pre-fills `target_kg`.
- **One breaking schema change is required** — `ALTER TABLE egg_records RENAME TO egg_collections` is necessary to align the live DB with the canonical spec. This is a one-way migration; all dependent code must be updated atomically.
- **Finance ****`amount`**** column** — live `types.ts` confirms `expenses.amount` still exists (Migration 5B not yet applied). The frontend fix (stop writing `amount`) is safe to deploy before Migration 5B runs, since the column still accepts writes. After Migration 5B runs, the column will be gone and the fix will be required.
- **Canonical stack** — TypeScript / React 19 / Supabase / Dexie.js / shadcn/ui. No new dependencies.
- **Offline-first** — the feed planning computation happens client-side using `feedPerBirdG` from `feed-data.ts`. No new API call is needed for the planning step.
- **Cost privacy** — any new cost fields in the weekly task plan must respect `farm.cost_privacy_enabled` (read from `useAppStore().costPrivacyEnabled` in the frontend, or from `user_preferences.cost_privacy_enabled` in the RPC).
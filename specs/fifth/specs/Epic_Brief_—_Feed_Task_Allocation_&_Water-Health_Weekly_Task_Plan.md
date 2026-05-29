# Epic Brief — Feed Task Allocation & Water-Health Weekly Task Plan

# Epic Brief — Feed Task Allocation & Water-Health Weekly Task Plan

**Epic:** epic:8defac00-3b0b-4081-8337-151887bd3118
**Status:** Approved for implementation — v3 (deep Lampfarms doc analysis complete)
**Stack:** TypeScript / React 19 / Supabase (Postgres + Edge Functions) / Dexie.js / shadcn/ui
**Ground-truth verified:** All claims confirmed against live source files, migrations, canonical specs, and deprecated Lampfarms docs.

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
- file:exactly-as-seen/src/hooks/useHealthData.ts line 458: `category: 'medication'` — non-canonical (should be `'health_and_medicine'`)
- file:exactly-as-seen/src/hooks/useFinanceData.ts line 73: reads `Number(e.amount_pesewas ?? 0) / 100` — **already correct** ✅
- file:exactly-as-seen/src/hooks/useStockData.ts line 109: inserts `quality_grade: 'A'` — **already fixed** ✅ (fourth_sprint.sql M1+M2)
- file:exactly-as-seen/src/hooks/useHealthData.ts lines 491–537: `fetchWeeklySummary` and `bulkCompleteWeekTasks` — **already implemented** ✅
- file:exactly-as-seen/supabase/migrations/20260525000000_fourth_sprint.sql: M3 renamed `egg_records` → `egg_collections`, M4 added `get_weekly_health_summary`, M5 added `bulk_complete_health_tasks` — **all already applied** ✅
- file:exactly-as-seen/supabase/functions/advance-batch-weeks/index.ts: calls `cron_advance_batch_weeks()` RPC — returns only `{ success, message }`, no phase change details
- file:exactly-as-seen/supabase/functions/push-alerts/index.ts line 27: only fires on `mortality_records` INSERT — confirmed

## 3. Live System Gaps (Confirmed from Source)

### Feed Gaps

| Gap | Evidence |
| --- | --- |
| **F1** — No "plan by duration" step before formulation | `FeedFormulation.tsx` goes straight to method selection; farmer enters `target_kg` raw. Deprecated Lampfarms Feed spec §1 labels this the **"CRITICAL Foundation"** step. |
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
| **H3** — No vaccination protocol checklist | `CompleteTaskInput` has `cost_pesewas` + `notes` only. Deprecated Lampfarms WH spec defines a 5-step pre-vaccination checklist. |
| **H4** — No weekly summary with `next_week_tasks` | Not in any current spec |
| **H5** — Traditional remedies mentioned in scope but unspecced | `03_WATER_HEALTH.md` §1 lists them; no `remedy_type` field, no dosing rules |
| **H6** — `water_records` table entirely unspecced | `useHealthData.ts` line 18: `type WaterRecord = Database['public']['Tables']['water_records']['Row']`; `logWater()` inserts into `water_records`; `WaterTab.tsx` renders water records — but `03_WATER_HEALTH.md` has no `water_records` table definition, no water consumption rate table, and no heat stress multiplier table |
| **H7** — Water consumption rates per species/week not in `03_WATER_HEALTH.md` | Deprecated Lampfarms WH spec §Species-Specific Protocols (lines 482–556) has complete ml/bird/day tables for all 4 species + heat stress multipliers (1.0×–3.0×). `dosing-utils.ts` `getWaterPrescription()` implements this client-side but it is not specced. |
| **H8** — Expense category mismatch: live code uses `'medication'` vs canonical `'health_and_medicine'` | `useHealthData.ts` line 458: `category: 'medication'`. Canonical `07_FINANCE.md` §2.1 defines `ExpenseCategory` as `'health_and_medicine'` (not `'medication'`). `useStockData.ts` lines 144–153 uses `'feed_purchase'`, `'medications'`, `'chicks_and_birds'`, `'equipment'` — none of which match the canonical enum (`'feed_and_nutrition'`, `'health_and_medicine'`, `'chicks_and_birds'`, `'equipment_and_tools'`). |
| **H9** — Vaccination completion → anti-stress auto-scheduling not in `03_WATER_HEALTH.md` | Deprecated Lampfarms WH spec §Integration Flows (lines 1942–1959) defines: vaccination completion → auto-schedule anti-stress (tomorrow + day after) + multivitamins (day after tomorrow). `markVaccineAdministered()` in `useHealthData.ts` (lines 243–260) only marks the vaccination as administered — no auto-scheduling. |
| **H10** — Medication stock deduction unit conversion is wrong | `markTaskComplete()` line 429: `qtyToDeduct = Number(task.computed_dose_amount \|\| task.container_count \|\| 1)`. `computed_dose_amount` is in `dose_unit` (tsp/tbsp/ml/g), not in the stock item's unit. Deducting `9.9 tsp` from a stock item measured in `ml` is meaningless. |
| **H11** — Emergency protocols (5 disease scenarios) not in `03_WATER_HEALTH.md` | Deprecated Lampfarms WH spec §Emergency Protocols (lines 641–827) defines 5 complete emergency protocols with emergency vs preventive dose distinction (e.g., Amprolium emergency = 2 tbsp/gal vs preventive = 1.5 tsp/gal). |

### Schema Correctness Gaps

| Gap | Evidence |
| --- | --- |
| **A** — `batch_tasks` table entirely unspecced | `cron_generate_daily_tasks()` (migration line 149) inserts into `batch_tasks`; `get_dashboard_overview` (migration lines 229–231) counts from both `batch_tasks` AND `health_tasks`; no canonical spec documents this table |
| **B** — Finance dual-column bug | `useHealthData.ts` line 458: `category: 'medication'` (non-canonical); `useStockData.ts` lines 144–153: non-canonical category strings; `useFinanceData.ts` line 73: reads `Number(e.amount_pesewas ?? 0) / 100` ✅ (already fixed in live code); `addRevenue()` line 168: inserts `amount: data.amount` (GHS float, not pesewas) — separate bug |
| **C** — Stock `quality_grade: 'good'` vs canonical `'A'\|'B'\|'C'\|'damaged'` | **CLOSED** — `useStockData.ts` line 109 now inserts `quality_grade: 'A'` ✅; `20260525000000_fourth_sprint.sql` M1+M2 applied the data fix and CHECK constraint |
| **D** — `egg_records` → `egg_collections` | **CLOSED** — `20260525000000_fourth_sprint.sql` M3 renamed the table and recreated both Postgres functions ✅ |
| **E** — `feed_schedules` vs `feed_consumption` in Records CTE | `08_RECORDS.md` §5.3 CTE still uses `FROM feed_consumption` and `consumed_kg` — spec-only fix needed; live Postgres function already correct |

## 4. Scope

### In Scope

**Feature Work (new user-facing capabilities):**

1. **Feed Planning Step** — Add `'plan'` to `FeedMethod` in `FeedFormulation.tsx`. Before any formulation method, the farmer sets a planning horizon: "Plan for X days" or "Plan for X weeks." The system auto-computes `target_kg = feedPerBirdG × current_quantity × duration_days / 1000` using `feedPerBirdG` from `feed-data.ts` (client-side, no new API call). The result pre-fills `target_kg` in the existing method components (`ReadyMadeFeed`, `CustomFormulation`, `ConcentrateMix`). The farmer also sees "≈ N bags of 50 kg."
2. **Feed Phase Transition Prompt** — When `Feed.tsx` detects that the current phase's `feedPerBirdG` differs from the last `feed_schedules` row's `amount_per_bird_g`, show a dismissible alert card prompting the farmer to plan the new phase's feed. Client-side comparison — no new API call.
3. **Weekly Health Task Plan View** — Add a **"This Week"** tab (4th tab, leftmost) to `Health.tsx` alongside the existing `Vaccines | Meds | Water` tabs. Shows all `health_tasks` and `batch_tasks` for the current week with aggregate stats (`tasks_total`, `tasks_completed`, `tasks_pending`, `estimated_cost_pesewas`) and an "Upcoming Tasks (Week N+1)" preview. **Already partially implemented:** `useHealthData.ts` already exports `weeklySummary`, `batchTasks`, `fetchWeeklySummary`, `bulkCompleteWeekTasks` (lines 49–51, 491–537). The `Health.tsx` tab UI is the remaining work.
4. **Bulk Complete Health Tasks** — A "Complete All Pending Tasks" action that marks all pending `health_tasks` for the current week as completed in a single RPC call. `batch_tasks` (feed_log, water_log, egg_collection) are excluded — they require individual completion with a quantity. **Already implemented:** `bulk_complete_health_tasks` RPC is in `20260525000000_fourth_sprint.sql` M5 ✅.
5. **Weekly Summary RPC** — `get_weekly_health_summary(p_batch_id, p_week_number, p_farm_id)` returning `{ health_tasks_total, health_tasks_completed, health_tasks_pending, batch_tasks_total, batch_tasks_completed, total_health_cost_pesewas, next_week_tasks[] }`. **Already implemented:** in `20260525000000_fourth_sprint.sql` M4 ✅.
6. **`water_records`**** table spec** — Document the `water_records` table in `03_WATER_HEALTH.md` §3. Live schema confirmed from `useHealthData.ts` line 18 and `WaterTab.tsx`. Columns: `id`, `batch_id`, `farm_id`, `date`, `gallons_consumed`, `temperature_c`, `notes`.
7. **Water consumption rates spec** — Document the water consumption rate tables (ml/bird/day per species/week) and heat stress multipliers in `03_WATER_HEALTH.md`. These are implemented in `dosing-utils.ts` `getWaterPrescription()` but not specced. Source: deprecated Lampfarms WH spec §Species-Specific Protocols (lines 482–556).
8. **Expense category alignment** — Fix `useHealthData.ts` line 458: `category: 'medication'` → `category: 'health_and_medicine'`. Fix `useStockData.ts` lines 144–153: align all category strings to canonical `07_FINANCE.md` §2.1 enum (`'feed_and_nutrition'`, `'health_and_medicine'`, `'chicks_and_birds'`, `'equipment_and_tools'`). Fix `addRevenue()` line 168: insert `amount_pesewas: Math.round(Number(data.amount) * 100)` instead of `amount: data.amount`.
9. **Vaccination anti-stress auto-scheduling** — After `markVaccineAdministered()` succeeds, auto-insert anti-stress + multivitamin `health_tasks` for the next 2 days using the existing `FALLBACK_MEDS` from `health-auto-tasks.ts`. Source: deprecated Lampfarms WH spec §Integration Flows (lines 1942–1959).
10. **Medication stock deduction unit conversion** — Fix `markTaskComplete()` line 429: replace `qtyToDeduct = Number(task.computed_dose_amount || task.container_count || 1)` with a unit-aware conversion that maps `dose_unit` (tsp/tbsp/ml/g) to the stock item's `unit` field before deducting.

**Schema Correctness Work (prerequisite fixes):**

1. **`batch_tasks`**** table spec** — Document the `batch_tasks` table in `10_CORE_FLOWS.md`. Live schema confirmed from `types.ts` lines 79–135: columns are `id`, `batch_id`, `farm_id`, `title`, `description`, `due_date`, `task_type`, `completed`, `completed_at`, `created_at`, `updated_at`.
2. **Finance category strings** — Fix non-canonical category strings in `useHealthData.ts` (Gap H8) and `useStockData.ts` (Gap H8). Fix `addRevenue()` to write `amount_pesewas` (Gap B).
3. **Stock quality grade** — **CLOSED** — `20260525000000_fourth_sprint.sql` M1+M2 already applied ✅.
4. **`egg_records`**** → ****`egg_collections`** — **CLOSED** — `20260525000000_fourth_sprint.sql` M3 already applied ✅.
5. **`feed_schedules`**** spec + Records CTE fix** — Document `feed_schedules` table in `04_FEED_CALCULATOR.md` §3.1. Fix `08_RECORDS.md` §5.3 CTE: `FROM feed_consumption` → `FROM feed_schedules`, `consumed_kg` → `total_amount_kg`.

### Out of Scope

- Traditional remedies per-task `remedy_type` choice (deferred — 7 remedies with dosing rules exist in deprecated spec; implementation requires a new `traditional_remedies` table and dosing engine)
- Emergency protocols (5 disease scenarios) — deferred to a clinical content epic; requires vet sign-off on emergency doses
- Semi-intensive foraging modifiers (deferred — requires vet sign-off on modifier values)
- Push notifications beyond mortality alert (separate epic)
- Offline outbox conflict resolution for C1–C8 (separate epic)
- `feed_plan_cadence` preference in Settings (deferred — the planning step UI handles both per-week and per-phase naturally without a stored preference)

## 5. Success Criteria

| # | Criterion |
| --- | --- |
| SC-1 | Farmer can enter "Plan for 2 weeks" on the Feed page and see `target_kg` auto-computed as `feedPerBirdG × birds × 14 / 1000` with a bag count estimate |
| SC-2 | When a batch advances to a new phase, the UI shows a feed transition prompt with the new phase's consumption rate |
| SC-3 | The Health page shows a "This Week's Tasks" tab with all tasks for the current week, aggregate stats, and an upcoming week preview |
| SC-4 | "Complete All Pending Tasks" marks all pending health tasks for the week as completed in one action |
| SC-5 | `get_weekly_health_summary` RPC returns correct `health_tasks_completed`, `health_tasks_pending`, and `next_week_tasks` |
| SC-6 | `batch_tasks` table is documented in `10_CORE_FLOWS.md` |
| SC-7 | `water_records` table and water consumption rates (ml/bird/day per species/week + heat stress multipliers) are documented in `03_WATER_HEALTH.md` |
| SC-8 | `useHealthData.ts` expense inserts use `category: 'health_and_medicine'`; `useStockData.ts` uses canonical category strings |
| SC-9 | After `markVaccineAdministered()`, anti-stress + multivitamin tasks are auto-inserted for the next 2 days |
| SC-10 | Medication stock deduction uses unit-aware conversion (not raw `computed_dose_amount`) |
| SC-11 | `feed_schedules` is documented in `04_FEED_CALCULATOR.md` and the Records CTE uses the correct table name |
| SC-12 | Stock quality grade fix and `egg_records` rename are confirmed applied via `20260525000000_fourth_sprint.sql` |

## 6. Constraints

- **No new tables** for the feed planning step — `feed_schedules` already exists and is the correct table for logging actual consumption. The planning step is a UI computation that pre-fills `target_kg`.
- **One breaking schema change is required** — `ALTER TABLE egg_records RENAME TO egg_collections` is necessary to align the live DB with the canonical spec. This is a one-way migration; all dependent code must be updated atomically.
- **Finance ****`amount`**** column** — live `types.ts` confirms `expenses.amount` still exists (Migration 5B not yet applied). The frontend fix (stop writing `amount`) is safe to deploy before Migration 5B runs, since the column still accepts writes. After Migration 5B runs, the column will be gone and the fix will be required.
- **Canonical stack** — TypeScript / React 19 / Supabase / Dexie.js / shadcn/ui. No new dependencies.
- **Offline-first** — the feed planning computation happens client-side using `feedPerBirdG` from `feed-data.ts`. No new API call is needed for the planning step.
- **Cost privacy** — any new cost fields in the weekly task plan must respect `farm.cost_privacy_enabled` (read from `useAppStore().costPrivacyEnabled` in the frontend, or from `user_preferences.cost_privacy_enabled` in the RPC).
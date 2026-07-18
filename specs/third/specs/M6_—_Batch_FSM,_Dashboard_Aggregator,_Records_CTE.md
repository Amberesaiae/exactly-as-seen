# M6 — Batch FSM, Dashboard Aggregator, Records CTE

## Problem & Context

Three remaining modules complete the backend-first architecture:

**Batch FSM:** The current `batch-utils.ts` has a simple phase lookup table. There is no XState v5 machine, no withdrawal guard on termination, and no `occupied_by_batch_id` management on houses. A farmer can currently terminate a batch during an active withdrawal period.

**Dashboard:** The current `Dashboard.tsx` does client-side aggregation across multiple Supabase queries. The spec requires a single `DashboardOverview` aggregator that composes data from all modules.

**Records:** The current `useRecordsPerformance.ts` (Track A) does 6 parallel Supabase queries + client-side Map aggregation. The spec requires a single Postgres function CTE.

## Technical Approach

### Batch FSM — XState v5 (client-side)

The FSM is implemented in `src/lib/batch-fsm.ts` using XState v5. It is the **decision engine**, not the system of record. The DB is always the source of truth.

**8 states:** `created` → `brooding` → `starter` → `grower` → `finisher` → `withdrawal` → `ready_to_sell` → `terminated`

**Phase boundaries** (from CONVENTIONS §2.3):

| Species | brooding | starter | grower | finisher |
| --- | --- | --- | --- | --- |
| broiler | wk 1 | wk 1–3 | wk 4–5 | wk 6–8 |
| layer | wk 1–4 | wk 5–8 | wk 9–18 | wk 19+ |
| duck_meat | wk 1 | wk 2–3 | wk 4–6 | wk 7–10 |
| duck_layer | wk 1–4 | wk 5–8 | wk 9–19 | wk 20+ |
| turkey | wk 1–4 | wk 5–8 | wk 9–12 | wk 13–N |

**Key guards:**

- `TERMINATE_NORMAL` is blocked when `hasActiveWithdrawal = true` — the FSM simply does not define this transition from the `withdrawal` state
- `ADVANCE_WEEK` uses optimistic locking: `expectedCurrentWeek` must match `context.currentWeek`
- `EMERGENCY_TERMINATE` is always allowed from any state

**Integration with Supabase:**

1. Load batch from Supabase
2. Hydrate `BatchContext` from the row
3. Send event to a freshly-created XState actor
4. Persist resulting `phase` and `current_week` via Supabase update
5. If `TERMINATE_NORMAL` is attempted while `has_active_withdrawal = true` → show toast `"Cannot terminate batch during active withdrawal period"`

**`BatchDetail.tsx`**** terminate button** — checks `batch.has_active_withdrawal` before calling the FSM. If true, shows a blocking dialog explaining the withdrawal period.

**`houses.occupied_by_batch_id`** — set to `batch.id` on batch creation; set to `null` on termination.

### Dashboard Aggregator — Supabase Postgres Function

The `DashboardOverview` is computed by a Supabase Postgres function `get_dashboard_overview(farm_id UUID)` that returns a single JSON object. This replaces the multiple parallel queries in `Dashboard.tsx`.

The function composes:

- Active batch count and list (from `batches`)
- Tasks today count (from `health_tasks` where `scheduled_date = CURRENT_DATE` and not completed)
- Weekly expenses (from `expenses` where `date >= CURRENT_DATE - 7`)
- Monthly revenue (from `revenue` where `date >= date_trunc('month', CURRENT_DATE)`)
- Recent activity (last 5 from `activity_log`)
- Sync state (pending outbox count from Dexie — client-side only)

The function is called once on Dashboard mount and the result is cached in Dexie `dashboard_cache` with a 1-hour TTL.

### Records — Postgres CTE Function

The `useRecordsPerformance.ts` hook (Track A) is updated to call a single Supabase Postgres function `get_batch_record_summary(farm_id UUID, batch_ids UUID[])` instead of 6 parallel queries.

The function implements the CTE from `specs/08_RECORDS.md` §5.3 — joining `batches`, `mortality_records`, `feed_schedules`, `health_tasks`, `expenses`, `revenue`, and `egg_records` in a single query.

This reduces 6 round-trips to 1 and moves aggregation to the DB where it belongs.

### Acceptance Criteria

**Batch FSM:**

1. `TERMINATE_NORMAL` is blocked (toast shown) when `batch.has_active_withdrawal = true`
2. `EMERGENCY_TERMINATE` always succeeds regardless of withdrawal state
3. Phase transitions are correct for all species (broiler week 4 → `grower`, layer week 19 → `finisher`)
4. `houses.occupied_by_batch_id` is set on batch creation and cleared on termination
5. Batch wizard disables houses where `occupied_by_batch_id` is non-null

**Dashboard:**
6. `get_dashboard_overview` Postgres function exists and returns the correct shape
7. Dashboard mounts with a single function call, not multiple parallel queries
8. Result is cached in Dexie `dashboard_cache`; offline load serves from cache
9. `tasks_today_count` correctly counts health tasks due today (not completed)

**Records:**
10. `get_batch_record_summary` Postgres function exists
11. `useRecordsPerformance.ts` calls the function instead of 6 parallel queries
12. Mortality rate, feed consumed, health task completion, egg totals, expenses, revenue all correct
# T2 — Weekly Health Task Plan View & Bulk Complete

## Overview

Add a **"This Week"** tab to the Health page showing all `health_tasks` and `batch_tasks` for the current week, with aggregate stats, a bulk-complete action, and an upcoming-week preview.

**Status note:** The backend RPCs (`get_weekly_health_summary`, `bulk_complete_health_tasks`) and the `useHealthData.ts` hook functions (`fetchWeeklySummary`, `bulkCompleteWeekTasks`, `batchTasks` state) are **already implemented** in `20260525000000_fourth_sprint.sql` and `useHealthData.ts` lines 49–51, 491–537. The remaining work is the `Health.tsx` UI tab only.

**Source:** `spec:8defac00-3b0b-4081-8337-151887bd3118` — Gaps H1, H2, H4, R-WH-15 through R-WH-20
**Ground-truth verified against:** file:exactly-as-seen/src/pages/Health.tsx, file:exactly-as-seen/src/hooks/useHealthData.ts, file:exactly-as-seen/supabase/migrations/20260525000000_fourth_sprint.sql

## Scope

### Backend — RPCs (Already Implemented)

Both RPCs are already implemented in `20260525000000_fourth_sprint.sql` M4 and M5 ✅:

- `get_weekly_health_summary(p_batch_id, p_week_number, p_farm_id)` — returns full weekly stats + `next_week_tasks`
- `bulk_complete_health_tasks(p_batch_id, p_week_number, p_farm_id, p_completed_at)` — marks all pending health tasks complete for the week

No new migrations needed for T2.

### Frontend — `Health.tsx` (file:exactly-as-seen/src/pages/Health.tsx)

**Current state (confirmed live code):**

- Line 101: `<Tabs defaultValue="vaccinations">`
- Line 102: `<TabsList className="w-full grid grid-cols-3">`
- Lines 103–118: 3 triggers: `vaccinations`, `medications`, `water`

**Changes:**

1. `grid-cols-3` → `grid-cols-4`
2. Add `<TabsTrigger value="this_week">` as the **first** trigger (leftmost) with a `CalendarCheck` or `ListChecks` icon
3. Change `defaultValue="vaccinations"` → `defaultValue="this_week"`
4. Add `<TabsContent value="this_week">` rendering:
  - Weekly stats grid: Total / Done / Pending / Est. Cost (masked when `costPrivacyEnabled`)
  - "Complete All Pending (N)" button — calls `bulkCompleteWeekTasks(selectedBatch, batchAge.week)`
  - Pending `health_tasks` cards (sorted by `scheduled_date`): `product_name`, dose info from `computed_dose_amount + computed_dose_unit`, status badge, "Complete" button (calls existing `markTaskComplete()`)
  - `batch_tasks` cards for the week: title, description, "Log" button (navigates to relevant page)
  - Completed tasks (collapsed, expandable)
  - "Upcoming — Week N+1" preview from `weeklySummary.next_week_tasks`

### Frontend — `useHealthData.ts` (Already Implemented)

**Status: DONE** ✅ — Confirmed from live code:

- Lines 49–51: `weeklySummary`, `weeklyLoading`, `batchTasks` state already declared
- Lines 99–112: `batch_tasks` loaded in existing `useEffect` alongside `health_tasks`, `vaccination_schedule`, `water_records`
- Lines 491–507: `fetchWeeklySummary()` implemented using `supabase.rpc('get_weekly_health_summary', ...)`
- Lines 509–537: `bulkCompleteWeekTasks()` implemented using `supabase.rpc('bulk_complete_health_tasks', ...)`
- Lines 572–576: all new exports already in return object

No changes needed to `useHealthData.ts`.

### Offline

- Weekly summary: served from Dexie cache when offline; show `⏳ cached` indicator
- Bulk complete: queued in `sync_outbox` via `queueWrite()`; applied optimistically to `healthTasks` state

## Acceptance Criteria

"This Week" tab is the leftmost tab in `Health.tsx` and is the default tab (`defaultValue="this_week"`)
Weekly stats grid shows correct `health_tasks_total`, `health_tasks_completed`, `health_tasks_pending` from `get_weekly_health_summary` RPC
`total_health_cost_pesewas` is masked (`●●●●`) when `costPrivacyEnabled = true`
"Complete All Pending (N)" button calls `bulk_complete_health_tasks` RPC and updates task cards optimistically
Bulk complete is idempotent: calling twice → second call returns `completed_count = 0`
`batch_tasks` (feed_log, water_log, egg_collection) appear in the weekly view with "Log" buttons but are NOT marked complete by the bulk complete action
Upcoming week preview shows next week's `health_tasks` with `product_name`, `scheduled_date`, and vaccination flag
Week date range is computed from `batch.start_date + (batchAge.week - 1) × 7` days
Offline: weekly summary served from Dexie cache with `⏳ cached` indicator when `navigator.onLine === false`

## Files to Change

- file:exactly-as-seen/src/pages/Health.tsx (add `this_week` tab, change `grid-cols-3` → `grid-cols-4`, change `defaultValue` — **this is the only remaining work**)

## No Changes Needed

- file:exactly-as-seen/src/hooks/useHealthData.ts — already fully implemented ✅
- Migrations — both RPCs already in `20260525000000_fourth_sprint.sql` ✅
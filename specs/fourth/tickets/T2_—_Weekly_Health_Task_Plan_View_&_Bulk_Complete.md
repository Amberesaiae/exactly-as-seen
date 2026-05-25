# T2 — Weekly Health Task Plan View & Bulk Complete

## Overview

Add a **"This Week"** tab to the Health page showing all `health_tasks` and `batch_tasks` for the current week, with aggregate stats, a bulk-complete action, and an upcoming-week preview. Add two new Postgres RPCs to support this.

**Source:** `spec:8defac00-3b0b-4081-8337-151887bd3118` — Gaps H1, H2, H4, R-WH-15 through R-WH-20
**Ground-truth verified against:** file:exactly-as-seen/src/pages/Health.tsx, file:exactly-as-seen/src/hooks/useHealthData.ts, file:exactly-as-seen/supabase/migrations/20260414080005_rpc_and_jobs.sql

## Scope

### Backend — New Postgres RPCs (deploy before frontend)

**RPC 1: ****`get_weekly_health_summary`**

```sql
CREATE OR REPLACE FUNCTION public.get_weekly_health_summary(
  p_batch_id UUID,
  p_week_number INT,
  p_farm_id UUID
) RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_start_date DATE;
  v_week_start DATE;
  v_week_end DATE;
  v_cost_privacy BOOLEAN;
BEGIN
  SELECT start_date INTO v_start_date FROM public.batches WHERE id = p_batch_id;
  v_week_start := v_start_date + ((p_week_number - 1) * 7);
  v_week_end := v_week_start + 6;
  SELECT COALESCE(cost_privacy_enabled, false) INTO v_cost_privacy
  FROM public.user_preferences up
  JOIN public.farms f ON f.user_id = up.user_id
  WHERE f.id = p_farm_id;
  RETURN jsonb_build_object(
    'health_tasks_total', (SELECT COUNT(*) FROM public.health_tasks WHERE batch_id=p_batch_id AND scheduled_date BETWEEN v_week_start AND v_week_end),
    'health_tasks_completed', (SELECT COUNT(*) FROM public.health_tasks WHERE batch_id=p_batch_id AND completed=true AND scheduled_date BETWEEN v_week_start AND v_week_end),
    'health_tasks_pending', (SELECT COUNT(*) FROM public.health_tasks WHERE batch_id=p_batch_id AND completed=false AND scheduled_date BETWEEN v_week_start AND v_week_end),
    'batch_tasks_total', (SELECT COUNT(*) FROM public.batch_tasks WHERE batch_id=p_batch_id AND due_date BETWEEN v_week_start AND v_week_end),
    'batch_tasks_completed', (SELECT COUNT(*) FROM public.batch_tasks WHERE batch_id=p_batch_id AND completed=true AND due_date BETWEEN v_week_start AND v_week_end),
    'total_health_cost_pesewas', CASE WHEN v_cost_privacy THEN NULL ELSE (SELECT SUM(cost_pesewas) FROM public.health_tasks WHERE batch_id=p_batch_id AND completed=true AND scheduled_date BETWEEN v_week_start AND v_week_end) END,
    'next_week_tasks', COALESCE((SELECT jsonb_agg(jsonb_build_object('product_name', product_name, 'task_type', task_type, 'scheduled_date', scheduled_date, 'is_vaccination', task_type='vaccination')) FROM public.health_tasks WHERE batch_id=p_batch_id AND scheduled_date BETWEEN v_week_end+1 AND v_week_end+7), '[]'::jsonb)
  );
END;
$$;
```

**RPC 2: ****`bulk_complete_health_tasks`**

```sql
CREATE OR REPLACE FUNCTION public.bulk_complete_health_tasks(
  p_batch_id UUID,
  p_week_number INT,
  p_farm_id UUID,
  p_completed_at TIMESTAMPTZ DEFAULT NOW()
) RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_start_date DATE;
  v_week_start DATE;
  v_week_end DATE;
  v_task_ids UUID[];
BEGIN
  SELECT start_date INTO v_start_date FROM public.batches WHERE id = p_batch_id;
  v_week_start := v_start_date + ((p_week_number - 1) * 7);
  v_week_end := v_week_start + 6;
  UPDATE public.health_tasks
  SET completed = true, completed_at = p_completed_at
  WHERE batch_id = p_batch_id AND farm_id = p_farm_id
    AND completed = false
    AND scheduled_date BETWEEN v_week_start AND v_week_end
  RETURNING id INTO v_task_ids; -- Note: use array_agg in actual impl
  RETURN jsonb_build_object(
    'completed_count', array_length(v_task_ids, 1),
    'task_ids', v_task_ids
  );
END;
$$;
-- Note: batch_tasks are NOT updated by this function (R-WH-18)
```

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

### Frontend — `useHealthData.ts` (file:exactly-as-seen/src/hooks/useHealthData.ts)

**Current exports (confirmed lines 444–475):** 25 exports including `batches`, `selectedBatch`, `healthTasks`, `medications`, `containerTypes`, `markTaskComplete`, etc.

**New additions to the hook:**

```ts
// New state
const [weeklySummary, setWeeklySummary] = useState<WeeklySummary | null>(null);
const [weeklyLoading, setWeeklyLoading] = useState(false);
const [batchTasks, setBatchTasks] = useState<any[]>([]);

// Load batch_tasks alongside health_tasks (in existing useEffect at line 61)
// Add to Promise.all:
supabase.from('batch_tasks').select('*').eq('batch_id', selectedBatch)
  .gte('due_date', weekStart).lte('due_date', weekEnd)

// New functions
const fetchWeeklySummary = async (batchId: string, weekNumber: number) => { ... };
const bulkCompleteWeekTasks = async (batchId: string, weekNumber: number) => { ... };
```

Add `weeklySummary`, `weeklyLoading`, `batchTasks`, `fetchWeeklySummary`, `bulkCompleteWeekTasks` to the return object.

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

- file:exactly-as-seen/src/pages/Health.tsx (add `this_week` tab, change `grid-cols-3` → `grid-cols-4`, change `defaultValue`)
- file:exactly-as-seen/src/hooks/useHealthData.ts (add `weeklySummary`, `weeklyLoading`, `batchTasks`, `fetchWeeklySummary`, `bulkCompleteWeekTasks`; load `batch_tasks` in existing `useEffect`)
- New migration file: `get_weekly_health_summary` and `bulk_complete_health_tasks` Postgres functions (deploy before frontend)
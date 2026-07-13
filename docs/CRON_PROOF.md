# Hosted cron proof (Q1)

**Status:** Checklist for operators — not automated in CI.  
**Project:** Supabase hosted `lampfarms` (see `docs/CANONICAL_RUNTIME.md`).

## Expected schedules

| Job | Edge function / SQL | Typical schedule | Proves |
|-----|---------------------|------------------|--------|
| Daily batch tasks | `generate-daily-tasks` / `cron_generate_daily_tasks` | ~06:00 farm TZ | `batch_tasks` feed/water/egg rows |
| Week advance | `advance-batch-weeks` | daily | `batches.current_week` |
| Withdrawal sweep | `check-withdrawal-periods` | daily | clears `has_active_withdrawal` when expired |
| Push / prune | optional | as configured | alerts hygiene |

## How to prove (dashboard)

1. Supabase Dashboard → **Edge Functions** → confirm functions deployed (`bun run functions:deploy` if needed).
2. **Database → Extensions / Cron** (or **Integrations → Cron**) → list schedules; screenshot scheduled SQL / HTTP jobs.
3. SQL check after schedule window:

```sql
-- Today's operational tasks (should be non-empty after cron or client ensure)
SELECT task_type, completed, count(*)
FROM batch_tasks
WHERE due_date = CURRENT_DATE
GROUP BY 1, 2
ORDER BY 1;

-- Active batches week progression (spot-check after advance job)
SELECT id, name, current_week, current_day, status
FROM batches
WHERE status = 'active'
LIMIT 20;
```

4. Client safety net: app also calls `ensureDailyBatchTasks` on Dashboard + Health load so empty UI does not wait on cron alone.

## Pass criteria

- [ ] Cron or HTTP schedule visible for generate-daily-tasks (or documented equivalent)
- [ ] At least one farm shows `batch_tasks` for `CURRENT_DATE` (cron **or** client ensure)
- [ ] Withdrawal clear job exists or is tracked as deferred with owner

**Note:** CI does not claim Q1 complete until this checklist is filled by a human on hosted.

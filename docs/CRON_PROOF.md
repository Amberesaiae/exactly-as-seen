# Hosted cron proof (Q1)

**Status:** **PROVED on hosted 2026-07-13** (live SQL + edge list)  
**Project:** `ulliwnizurgfbwryhnng` (lampfarms)

## Live evidence (this session)

### pg_cron jobs (all active)

| jobid | jobname | schedule | command | active |
|------:|---------|----------|---------|--------|
| 1 | advance-batch-weeks-job | `0 * * * *` | `SELECT public.cron_advance_batch_weeks();` | true |
| 2 | check-withdrawal-periods-job | `0 */4 * * *` | `SELECT public.cron_check_withdrawal_periods();` | true |
| 3 | generate-daily-tasks-job | `0 * * * *` | `SELECT public.cron_generate_daily_tasks();` | true |
| 4 | prune-idempotency-keys-job | `0 3 * * *` | `SELECT public.cron_prune_idempotency_keys();` | true |

Queried via: `supabase db query --linked` → `SELECT … FROM cron.job`.

### Edge functions (ACTIVE)

| Name | Status | Updated (UTC) |
|------|--------|-----------------|
| advance-batch-weeks | ACTIVE | 2026-07-13 |
| generate-daily-tasks | ACTIVE | 2026-07-13 |
| check-withdrawal-periods | ACTIVE | 2026-07-13 |
| prune-idempotency-keys | ACTIVE | 2026-07-13 |
| push-alerts | ACTIVE | 2026-07-13 |

### Domain snapshot (same day)

| Metric | Value |
|--------|------:|
| medications | 52 |
| ingredients | 46 |
| active_batches | 7 |
| vaccination_schedule rows | 44 |
| batch_tasks due today | 14 (feed_log + water_log) |

### Client safety net

App also calls `ensureDailyBatchTasks` on Dashboard + Health load and marks tasks complete when feed/water/egg are logged (`markBatchTaskComplete` + load-time reconcile).

## Pass criteria

- [x] Cron schedules visible and **active** for all four jobs
- [x] Edge functions deployed ACTIVE
- [x] `batch_tasks` for `CURRENT_DATE` non-empty
- [x] Client ensure + complete path in code

**Q1 closed for production evidence.** Re-run SQL above after deploys if schedules change.

# M5 — Scheduled Jobs: Edge Functions + pg_cron

## Problem & Context

Three background jobs described in the specs do not exist. As a result:

- `batches.current_week` is never auto-incremented — farmers must manually advance weeks
- `batches.has_active_withdrawal` is never auto-cleared — withdrawal state persists forever once set
- Daily health tasks are never auto-generated — farmers must manually create every task

The spec (CONVENTIONS §2.11) requires these jobs to run in farm timezone. Supabase's `pg_cron` runs in UTC only. The workaround: run jobs at UTC midnight and filter by `farm.timezone` in the function body to determine which farms are at the correct local time.

**Constraints:**

- Supabase Edge Functions (Deno) are the execution environment — no Node.js, no pg-boss
- `pg_cron` is the scheduler — fixed cron expressions, no per-farm timezone scheduling
- The week advancement job must use optimistic locking (CONVENTIONS §2.14) — `UPDATE batches WHERE current_week = $expected RETURNING *`
- The withdrawal sweep must update `batches.has_active_withdrawal = false` and is the trigger for clearing the FSM withdrawal state client-side

## Technical Approach

### Job 1 — `advance-batch-weeks` (Sunday 00:00 UTC)

**pg_cron schedule:** `0 0 * * 0`

**Edge Function logic:**

1. Query all farms with their `timezone`
2. For each farm, check if `NOW() AT TIME ZONE farm.timezone` is between 00:00 and 01:00 (Sunday)
3. For matching farms, query all active batches (not `terminated`, not `ready_to_sell`)
4. For each batch, attempt the optimistic UPDATE:
     ```sql
      UPDATE batches
      SET current_week = current_week + 1, updated_at = NOW()
      WHERE id = $batchId AND current_week = $expectedCurrentWeek
      RETURNING *
     ```
5. Zero rows returned → batch was manually advanced by farmer; skip (not an error)
6. After advancing, recompute `phase` based on species/duck_type phase boundaries
7. Update `batches.phase` if changed
8. Update `houses.occupied_by_batch_id` — set to `null` when batch reaches `terminated`

### Job 2 — `check-withdrawal-periods` (every 4 hours UTC)

**pg_cron schedule:** `0 */4 * * *`

**Edge Function logic:**

1. Query all batches where `has_active_withdrawal = true`
2. For each batch, query `health_tasks` where `withdrawal_meat_until > CURRENT_DATE OR withdrawal_eggs_until > CURRENT_DATE`
3. If no such tasks exist → set `batches.has_active_withdrawal = false`
4. This is the signal that the client-side FSM can transition from `withdrawal` → `ready_to_sell`

The client detects this change on next data load (the batch's `has_active_withdrawal` field is read on every `useHealthData` mount).

### Job 3 — `generate-daily-tasks` (06:00 farm timezone)

**pg_cron schedule:** `0 6 * * *` (UTC — filtered by farm timezone in function body)

**Edge Function logic:**

1. Query all farms where `NOW() AT TIME ZONE farm.timezone` is between 06:00 and 07:00
2. For each farm, query all active batches
3. For each batch, determine today's tasks based on species protocol and current week/day
4. Insert `batch_tasks` rows for today's tasks (using `ON CONFLICT DO NOTHING` on `(batch_id, due_date, task_type)`)

This job generates the "tasks today" count shown on the Dashboard.

### Job 4 — `prune-idempotency-keys` (03:00 UTC daily)

**pg_cron schedule:** `0 3 * * *`

**Edge Function logic:** Delete `idempotency_keys` rows where `expires_at < NOW()`. Simple cleanup.

### Deployment

Edge Functions are deployed via `supabase functions deploy`. The `pg_cron` schedules are added in a new migration:

```sql
SELECT cron.schedule('advance-batch-weeks', '0 0 * * 0',
  $$SELECT net.http_post(url:='https://[project].supabase.co/functions/v1/advance-batch-weeks', ...)$$);
```

### Acceptance Criteria

1. `advance-batch-weeks` increments `current_week` for all active batches on Sunday
2. Optimistic lock: if farmer manually advanced the week before the job runs, the job skips that batch without error
3. `phase` is recomputed correctly after week advancement (broiler week 4 → `grower`)
4. `check-withdrawal-periods` sets `has_active_withdrawal = false` when all withdrawal dates have passed
5. `generate-daily-tasks` creates `batch_tasks` rows for today's tasks at 06:00 farm timezone
6. All jobs are idempotent — running twice produces the same result
7. `prune-idempotency-keys` removes expired keys daily
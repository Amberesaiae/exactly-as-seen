# BC-5 — Scheduled Jobs: Edge Functions + pg_cron (M5)

## Overview

Implement 3 Supabase Edge Functions triggered by pg_cron: week advancement (Sunday), withdrawal sweep (every 4h), and daily task generation (06:00 farm timezone).

**Spec reference:** spec:e4556d74-53bc-432d-b750-3db37d529bab/`[M5 spec id]`

## Scope

### Edge Function 1 — `advance-batch-weeks`

Create `supabase/functions/advance-batch-weeks/index.ts`:

- Query all farms with timezone
- Filter to farms where current time in farm timezone is Sunday 00:00–01:00
- For each matching farm's active batches: optimistic UPDATE `current_week = current_week + 1 WHERE current_week = $expected`
- Recompute `phase` from species/duck_type phase boundaries
- Update `batches.phase` if changed
- Clear `houses.occupied_by_batch_id` for terminated batches

### Edge Function 2 — `check-withdrawal-periods`

Create `supabase/functions/check-withdrawal-periods/index.ts`:

- Query batches where `has_active_withdrawal = true`
- For each: check if any `health_tasks` row has `withdrawal_meat_until > CURRENT_DATE OR withdrawal_eggs_until > CURRENT_DATE`
- If none: `UPDATE batches SET has_active_withdrawal = false WHERE id = $batchId`

### Edge Function 3 — `generate-daily-tasks`

Create `supabase/functions/generate-daily-tasks/index.ts`:

- Query farms where current time in farm timezone is 06:00–07:00
- For each farm's active batches: generate today's `batch_tasks` rows based on species protocol and current week/day
- Insert with `ON CONFLICT DO NOTHING` on `(batch_id, due_date, task_type)`

### Edge Function 4 — `prune-idempotency-keys`

Create `supabase/functions/prune-idempotency-keys/index.ts`:

- Delete `idempotency_keys` where `expires_at < NOW()`

### Migration — pg_cron schedules

Add a new migration that registers all 4 pg_cron schedules using `cron.schedule()`.

## Acceptance Criteria

- `advance-batch-weeks` increments `current_week` for active batches on Sunday
- Optimistic lock: farmer-advanced batch is skipped without error
- Phase recomputed correctly after advancement
- `check-withdrawal-periods` clears `has_active_withdrawal` when all withdrawal dates passed
- `generate-daily-tasks` creates `batch_tasks` for today at 06:00 farm timezone
- All jobs are idempotent
- pg_cron schedules registered in migration

## Dependencies

BC-1 (schema — `batches.has_active_withdrawal`, `batches.duck_type`, `houses.occupied_by_batch_id`)
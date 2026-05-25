# Sprint 1 — Phase 1 Completion: Species Seeds + Daily Task Job + Withdrawal Sweep

## Goal

Complete Phase 1. The missing pieces: farm water-source state, species config seeds, `generateDailyBatchTasks` pg-boss job, and `checkWithdrawalPeriods` pg-boss job.

## Changes Required

### 0. Farm water-source prerequisite — file:lib/db/src/schema/app.ts

- Add `water_source_chlorinated boolean not null default false` to `farms`
- This unblocks Water-Health conflict `C8`
- If an existing setup/edit flow can expose it early, do so; otherwise the column may remain at the default until the Settings module is rebuilt

### 1. Species Config Seeds — file:scripts/src/seed-species-config.ts

Insert 6 rows into `species_config` table (one per species/variant):

- `broiler` — full JSON from file:specs/11_PROTOCOL_BROILER.md §10
- `layer` — full JSON from file:specs/12_PROTOCOL_LAYER.md config section
- `duck` / `meat` — from file:specs/13_PROTOCOL_DUCK.md §11.1
- `duck` / `layer` — from file:specs/13_PROTOCOL_DUCK.md §11.2
- `turkey` — from file:specs/14_PROTOCOL_TURKEY.md §11
- `other` — from file:specs/15_PROTOCOL_OTHER_SPECIES.md §11

Use `onConflictDoNothing()` so re-runs are safe. Add `pnpm --filter @workspace/scripts run seed` command.

Note: `speciesConfigTable` in file:lib/db/src/schema/system.ts has `species` as unique — duck needs a `variant` column added to the schema to support two duck rows.

### 2. `generateDailyBatchTasks` Job — file:artifacts/api-server/src/lib/jobs.ts

Register a pg-boss job scheduled at `0 6 * * *` in each farm's timezone. For each active batch:

1. Load `species_config` row for the batch's species (+ duck_type variant)
2. Compute today's day-of-batch from `start_date` and farm timezone
3. Find all `schedule` entries matching today's day
4. For each entry, create a `health_tasks` row if one doesn't already exist for that batch + medication + date (idempotent)
5. Apply duck niacin auto-task logic (daily Days 1–28, weekly thereafter) for `species = 'duck'`
6. Apply turkey Metronidazole biweekly logic for `species = 'turkey'`

Dose calculation: `dose_amount = medication.dose_per_gallon × (per_bird_water_ml × birds / 1000 / 3.785)`

### 3. `checkWithdrawalPeriods` Job — file:artifacts/api-server/src/lib/jobs.ts

Register a pg-boss job scheduled every 4 hours (`0 */4 * * *`, UTC). For each batch where `has_active_withdrawal = true`:

1. Query `MAX(withdrawal_meat_until)` from `health_tasks` where `status = 'completed'`
2. If `MAX < today` → set `has_active_withdrawal = false`, publish `BATCH_WITHDRAWAL_CLEARED` via outbox

## Acceptance Criteria

`farms.water_source_chlorinated` exists with default `false`pnpm --filter @workspace/scripts run seed inserts 6 species config rows without errorRe-running seed is idempotent (no duplicate key errors)generateDailyBatchTasks creates correct tasks for a broiler batch on Day 7 (Gumboro vaccine)Duck batch Day 1 gets a niacin task; Day 29 gets a weekly niacin taskTurkey batch gets Metronidazole on Day 8 and Day 22checkWithdrawalPeriods clears has_active_withdrawal after withdrawal date passesBATCH_WITHDRAWAL_CLEARED event appears in outbox_messagespnpm run typecheck passes
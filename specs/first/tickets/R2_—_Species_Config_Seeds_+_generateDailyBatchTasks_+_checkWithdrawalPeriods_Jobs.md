# R2 — Species Config Seeds + generateDailyBatchTasks + checkWithdrawalPeriods Jobs

## Goal

Seed all 6 species config rows and register the two missing pg-boss jobs. Depends on R1 (needs `species_config.variant` column).

## Spec Reference

spec:3a092065-e868-4799-849c-f707a0553261/b7f8a421-4897-4bc3-bfc4-850e84f63a24 — Sprint 1 §1.1–1.3

## Dependencies

- R1 must be merged first

## Changes Required

### 1. Species Config Seed — file:scripts/src/seed-species-config.ts

Insert 6 rows using `onConflictDoNothing()` on `(species, variant)`:

| species | variant | Source |
| --- | --- | --- |
| broiler | default | file:specs/11_PROTOCOL_BROILER.md §10 |
| layer | default | file:specs/12_PROTOCOL_LAYER.md |
| duck | meat | file:specs/13_PROTOCOL_DUCK.md §11.1 |
| duck | layer | file:specs/13_PROTOCOL_DUCK.md §11.2 |
| turkey | default | file:specs/14_PROTOCOL_TURKEY.md §11 |
| other | default | file:specs/15_PROTOCOL_OTHER_SPECIES.md §11 |

Add `pnpm --filter @workspace/scripts run seed` to file:scripts/package.json.

### 2. `generateDailyBatchTasks` Job — file:artifacts/api-server/src/lib/jobs.ts

Register queue `health.daily-tasks`, schedule `0 6 * * *` per farm timezone. Worker: for each active batch, compute `dayOfBatch`, read `species_config` row, find matching schedule entries, insert `health_tasks` rows idempotently on `(batch_id, medication_id, scheduled_date)`. Apply duck niacin (daily Days 1–28, weekly thereafter) and turkey Metronidazole (every 14 days) logic.

### 3. `checkWithdrawalPeriods` Job — file:artifacts/api-server/src/lib/jobs.ts

Register queue `health.withdrawal-sweep`, schedule `0 */4 * * *` UTC. Worker: for each batch where `has_active_withdrawal = true`, query `MAX(withdrawal_meat_until)` from completed health tasks. If `MAX < today`, set `has_active_withdrawal = false` and publish `BATCH_WITHDRAWAL_CLEARED`.

## Acceptance Criteria

- Seed inserts 6 rows; re-run is idempotent
- Duck has two rows: `(duck, meat)` and `(duck, layer)`
- `generateDailyBatchTasks` creates a Gumboro task for a broiler batch on Day 7
- Duck batch Day 1 gets a niacin task; Day 29 gets weekly (not daily)
- Turkey batch gets Metronidazole on Day 8 and Day 22
- `checkWithdrawalPeriods` clears `has_active_withdrawal` after withdrawal date passes
- `BATCH_WITHDRAWAL_CLEARED` appears in `outbox_messages`
- `pnpm run typecheck` passes
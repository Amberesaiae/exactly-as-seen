# Sprint 2A — Water-Health Module: DB Schema + Backend API + Conflict Matrix

## Goal

Implement the complete Water-Health backend module per file:specs/03_WATER_HEALTH.md. This is the most operationally critical module.

## Scope

### DB Schema (file:lib/db/src/schema/)

New file `water-health.ts`:

- `medications` table — 52+ rows seeded (including Metronidazole, niacin, all injection vaccines)
- `container_types` table — exactly 9 rows seeded per CONVENTIONS §2.3
- `health_tasks` table (evolved in place) — add `delivery_method`, `medication_id` FK, `container_type_id`, `computed_dose_amount`, `blocked_reason`, `withdrawal_meat_until`, `withdrawal_eggs_until`, and concrete task timing for hour-based conflicts while preserving legacy compatibility columns during transition

Do **not** rename legacy `health_tasks` in file:lib/db/src/schema/app.ts during backend-first delivery. Extend it additively so Sprint 1 jobs, the CRUD shim, and the new Water-Health module can coexist until frontend cutover. Cleanup of legacy-only columns happens only after frontend cutover.

### Module (file:artifacts/api-server/src/modules/water-health/)

Files to create:

- `routes.ts` — all 7 endpoints mounted at `/api/v1/health`
- `service.ts` — business logic
- `conflicts.ts` — C1–C8 conflict matrix detector
- `dosing.ts` — `computeDose(med, waterVolumeL)` function
- `seed/medications.ts` — full medication seed data

### Key Implementation Rules

- **Dosing formula:** `dose_amount = medication.dose_per_gallon × (water_volume_l / 3.785)` — the legacy `×1.5` formula is permanently removed
- **Task timing:** store both farm-local date grouping and a concrete timestamp so `C4`, `C6`, and `C7` can be enforced precisely
- **C4 window:** 72 hours (not 48h) — vaccine + antibiotic guard
- **C6/C7 window:** real ±4-hour checks, not same-day approximations
- **Injection tasks:** `container_type_id`, `container_count`, `water_volume_l`, `computed_dose_amount` are all `null`; `bird_count` is set
- **C8:** Live vaccine on chlorinated water source → BLOCK (reads `farms.water_source_chlorinated`, which must exist before Sprint 2A starts)
- **Duck niacin:** Auto-generated on `BATCH_CREATED` event — daily Days 1–28, weekly thereafter
- **Turkey Metronidazole:** Auto-generated on `BATCH_CREATED` — every 2 weeks

### Event Integration

- Consume `BATCH_CREATED` → generate Day-1 protocol tasks
- Consume `BATCH_WEEK_ADVANCED` → generate new week's tasks
- Consume `BATCH_MORTALITY_RECORDED` → recompute `bird_count` on future injection tasks
- Publish `HEALTH_TASK_COMPLETED`, `BATCH_WITHDRAWAL_STARTED`, `BATCH_WITHDRAWAL_CLEARED`

## Validation Refinements (Canonical Implementation)

- `POST /api/v1/health/tasks` must carry a concrete `scheduled_at` timestamp for ad-hoc task creation. Using `scheduled_date` alone is not sufficient for canonical C4/C6/C7 enforcement.
- Conflict checks for C1 and C3 are order-independent. Creating the second medication in either direction must surface the same safety outcome.
- `GET /api/v1/health/batches/:batchId/tasks` must apply `week` and `status` filters server-side.
- The ticket is not complete until `BATCH_CREATED`, `BATCH_WEEK_ADVANCED`, and `BATCH_MORTALITY_RECORDED` consumers are wired for protocol generation and future injection-task bird-count recomputation.

## Acceptance Criteria

All 7 endpoints return correct responses per spec Zod schemasC1: Amprolium + sulfa antibiotic → 422 MEDICATION_CONFLICT with details.conflicts: ['C1']C2: Two antibiotics overlap → BLOCKC3: Dewormer + coccidiostat same day → WARN (task created, warning in response)C4: Live vaccine + antibiotic within 72h → BLOCK; at 73h → allowedC5: Enrofloxacin + any antibiotic → BLOCKC6: Activated charcoal + oral med within 4h → BLOCK using real task timestampsC7: Calcium + tetracycline within 4h → BLOCK using real task timestampsC8: Live vaccine on chlorinated source → BLOCK once `farms.water_source_chlorinated` is presentInjection task for duck_viral_hepatitis: container fields null, bird_count setDose for amprolium (1.5 tsp/gal) at 25L water = 9.9 tspDuck batch creation seeds niacin tasks daily Days 1–28 then weeklyTurkey batch seeds Metronidazole every 2 weeksCompleting oxytetracycline (7-day withdrawal) sets has_active_withdrawal = truepnpm run typecheck passes
# R5 — Frontend Rebuild: Water-Health + Feed Pages

## Goal

Replace file:artifacts/lampfarms/src/pages/Health.tsx (873 lines) and file:artifacts/lampfarms/src/pages/Feed.tsx + file:artifacts/lampfarms/src/pages/FeedFormulation.tsx with composed component trees that call the real Phase 2 API endpoints. No file over ~250 lines. Phase 2+ writes are online-only.

## Spec Reference

spec:3a092065-e868-4799-849c-f707a0553261/b7f8a421-4897-4bc3-bfc4-850e84f63a24 — Sprint 2C §2C.1–2C.2

## Dependencies

- R1 (tables exist), R3 (batch-utils fixed), R4 (auto-ledger wired)

## Water-Health Page

Replace `Health.tsx` with components calling `GET /api/v1/health/batches/:id/tasks`, `POST /api/v1/health/tasks`, `POST /api/v1/health/tasks/:id/complete`, `POST /api/v1/health/tasks/:id/skip`, `GET /api/v1/health/batches/:id/withdrawals`:

| Component | Responsibility |
| --- | --- |
| `BatchPicker` | Select active batch |
| `ConflictBanner` | Surface C1–C8 BLOCK/WARN from task create response |
| `AddTaskDialog` | Ad-hoc task creation — medication picker, date + time input (required for C4/C6/C7), container picker for water delivery |
| `VaccinationSchedule` | Protocol tasks list; injection tasks hide container/dose UI |
| `MedicationLog` | Task list with Complete/Skip actions; `computed_dose_amount` from server — never recalculated client-side |
| `WithdrawalTracker` | Active withdrawal countdown from `GET /withdrawals` |

**Key rules:**

- `computed_dose_amount` is always displayed from the server response — the frontend never recalculates dose
- Injection tasks: container picker and dose display are hidden
- `MEDICATION_TEMPLATES` local array in file:artifacts/lampfarms/src/lib/health-data.ts is deleted — medication data comes from `GET /api/v1/health/medications`
- `SPECIES_HEALTH_ALERTS` is kept for contextual alerts (heat stress, ascites, etc.)

## Feed Page

Replace `Feed.tsx`, `FeedFormulation.tsx`, and file:artifacts/lampfarms/src/components/feed/ with:

| Component | Responsibility |
| --- | --- |
| `FeedMethodPicker` | 4 cards: Automatic (LP), Flexible, Ready-Made, Concentrate Mix |
| `IngredientSelector` | Multi-select from `GET /api/v1/feed/ingredients`; shows stock availability |
| `FormulationResult` | Nutrition summary, cost breakdown, `solver_status` badge, fallback banner |
| `FallbackBanner` | Shown when `solver_status = 'fallback'`; explains why LP failed |
| `ConfirmToFeed` | Calls `POST /api/v1/feed/:id/confirm`; disabled when offline |

**Key rules:**

- Duck niacin is not shown in any feed UI — it is a Water-Health task
- file:artifacts/lampfarms/src/lib/feed-optimizer.ts (greedy heuristic) is deleted — LP runs server-side
- Confirm button is disabled when `navigator.onLine === false` (Phase 2+ writes are online-only)

## Acceptance Criteria

- Health page renders task list from real API; no hardcoded medication templates
- Conflict banner appears when `POST /health/tasks` returns `MEDICATION_CONFLICT`
- Injection tasks show no container/dose UI
- `computed_dose_amount` displayed from server response
- Feed page shows all 4 modes; LP result shows `solver_status` badge
- Fallback banner shown when `solver_status = 'fallback'`
- Duck batch formulation shows no niacin line
- Confirm button disabled offline
- No file over ~250 lines
- `pnpm run typecheck` passes
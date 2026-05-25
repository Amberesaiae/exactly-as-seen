# Sprint 2A — Feed Calculator Module: DB Schema + Backend API + highs-js LP

## Goal

Implement the complete Feed Calculator backend module per file:specs/04_FEED_CALCULATOR.md. Includes the `highs-js` LP solver, Safety Preprocessor, and all 4 feed modes.

## Scope

### DB Schema (file:lib/db/src/schema/feed.ts)

- `ingredients` table — seeded with West African ingredient catalogue (maize, soybean meal, fish meal, PKC, oyster shell, toxin binder, etc.)
- `nutritional_requirements` table — seeded per species/phase from spec
- `formulations` table — includes `solver_status`, `meets_requirements`, `lines` JSONB, `confirmed_at`

Rename legacy `feed_formulations`, `feed_ingredients` in `app.ts` to `legacy_*`.

### Module (file:artifacts/api-server/src/modules/feed/)

Files to create:

- `routes.ts` — 7 endpoints mounted at `/api/v1/feed`
- `service.ts` — orchestration
- `safety.ts` — Safety Preprocessor (5 rules; duck niacin explicitly NOT added — R-FC-5)
- `lp.ts` — `solveFeedLP()` using `highs-js` WASM singleton, 5s timeout, CPLEX-LP text format
- `fallback.ts` — Flexible Mix fallback when LP fails

### Key Implementation Rules

- **Duck niacin:** Safety Preprocessor MUST NOT add niacin for any species (R-FC-5). Test explicitly.
- **Toxin binder:** Always auto-added at 0.5% of `target_kg` for broiler/layer/duck/turkey (R-FC-1)
- **Gossypol block:** Layer + cotton-seed cake → 422 `LAYER_GOSSYPOL_BLOCKED` (R-FC-2)
- **Fish meal cap:** Broiler fish meal LP upper bound capped at 10% (R-FC-3)
- **Fallback:** `infeasible`/`timeout`/`error` → HTTP 200 with `fallback_used: true`, `solver_status: 'fallback'`
- **Confirm:** `POST /feed/:id/confirm` publishes `FEED_FORMULATION_CONFIRMED` to outbox (idempotent)
- **Phase derivation:** `layer_production` iff layer Week 19+ or duck-layer Week 20+

### Event Integration

- Publish `FEED_FORMULATION_CONFIRMED` → consumed by Stock (allocate ingredients) and Finance (create expense)

## Validation Refinements (Canonical Implementation)

- The server validates the requested `phase` against the batch's canonical derived phase (`species`, `current_week`, `duck_type`). A client-supplied mismatch is rejected.
- Nutritional requirement lookup is duck-type aware when `species = 'duck'`.
- Fallback formulations must still satisfy mass-balance to `target_kg` within the documented tolerance.

## Acceptance Criteria

Auto mode, broiler finisher, valid ingredients → solver_status: 'optimal', meets_requirements: trueAuto mode, layer + cotton-seed cake → 422 LAYER_GOSSYPOL_BLOCKEDAuto mode, infeasible problem → 200 with fallback_used: true, fallback_reason: 'LP_INFEASIBLE'Auto mode, mocked 5s timeout → fallback_reason: 'LP_TIMEOUT'Duck batch (any phase) — formulation contains NO niacin line (R-FC-5)Toxin binder auto-added at 0.5% even when no aflatoxin-risk ingredients selectedConfirm twice without idempotency key → 409 FORMULATION_ALREADY_CONFIRMEDConfirm with same Idempotency-Key → identical 200 responseLayer Week 19 batch → phase = layer_productionFEED_FORMULATION_CONFIRMED event in outbox after confirmpnpm run typecheck passes
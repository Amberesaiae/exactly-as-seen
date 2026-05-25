# Sprint 2B — Stock Module: DB Schema + Backend API + FIFO Allocator

## Goal

Implement the complete Stock Management backend module per file:specs/06_STOCK_MANAGEMENT.md. Includes lot-level tracking, FIFO+quality allocator, and event-driven auto-allocation.

## Scope

### DB Schema (file:lib/db/src/schema/stock.ts)

- `suppliers` table
- `stock_items` table (spec version — 5 categories, unit enum)
- `stock_lots` table — `qty_received`, `qty_on_hand`, `unit_cost_pesewas`, `quality_grade`, `expiry_date`, `received_at`
- `stock_allocations` table — `lot_id`, `batch_id`, `qty`, `reason`, `source_event`, `source_ref_id`, `reversed_at`

Rename legacy `stock_items`, `stock_transactions` in `app.ts` to `legacy_*`.

### Module (file:artifacts/api-server/src/modules/stock/)

- `routes.ts` — all 13 endpoints mounted at `/api/v1/stock`
- `service.ts` — business logic
- `allocator.ts` — `allocateFifoByQuality()` with `FOR UPDATE` row lock

### FIFO + Quality Allocator (CONVENTIONS §2.15)

Sort order:

1. Near-expiry bucket first (expiry ≤ 30 days from today → bucket 0, else bucket 1)
2. `expiry_date ASC NULLS LAST` within bucket
3. `received_at ASC` as final tiebreaker
4. `quality_grade = 'damaged'` excluded from auto-allocation entirely

Allocation is atomic — if insufficient stock, entire request rolls back and `STOCK_ALLOCATION_FAILED` is emitted.

### Event Integration

- Publish `STOCK_PURCHASED` on `POST /stock/purchases` → Finance auto-expense
- Consume `HEALTH_TASK_COMPLETED` → auto-allocate medication stock (intensive batches only)
- Consume `FEED_FORMULATION_CONFIRMED` → auto-allocate ingredient stock (intensive batches only)
- Consume `BATCH_TERMINATED` → reverse open `reserve` allocations

## Validation Refinements (Canonical Implementation)

- Transitional table naming is acceptable while the legacy UI remains live. A dedicated v2 stock-items table is an allowed implementation detail so long as the public API remains canonical and the old tables are left intact during backend-first delivery.
- The canonical feed trigger event is `FEED_FORMULATION_CONFIRMED`.
- The ticket is not complete until `STOCK_ALLOCATION_FAILED` is emitted on atomic allocation failure and the event-consumer wiring tracked in ticket:3a092065-e868-4799-849c-f707a0553261/4a0362e1-5eb6-4d5e-aef8-7efa42b05e4f is in place.

## Acceptance Criteria

Near-expiry lot (5 days) allocated before same-grade lot (60 days)damaged lot excluded from auto-allocation; available via manual override onlyFEED_FORMULATION_CONFIRMED with 3 ingredients where one is short → all rolled back, STOCK_ALLOCATION_FAILED emittedConcurrent allocations don't overdraw (transactional FOR UPDATE)Semi-intensive batch HEALTH_TASK_COMPLETED → no auto-allocationSTOCK_PURCHASED → Finance expense row created (assert via Finance fixture)Reverse outside 24h → 409 STOCK_REVERSE_WINDOW_EXPIREDPOST /stock/availability with expiryBufferDays=7 excludes 5-day-out lotpnpm run typecheck passes
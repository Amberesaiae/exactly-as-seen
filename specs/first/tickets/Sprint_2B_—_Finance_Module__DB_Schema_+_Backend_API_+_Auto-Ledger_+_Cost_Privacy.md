# Sprint 2B — Finance Module: DB Schema + Backend API + Auto-Ledger + Cost Privacy

## Goal

Implement the complete Finance backend module per file:specs/07_FINANCE.md. Includes auto-ledger consumers for 6 events, server-side cost privacy, and P&L CTE queries.

## Scope

### DB Schema (file:lib/db/src/schema/finance.ts)

- `expense_entries` table — `source`, `source_event`, `source_ref_id` for auto-ledger idempotency
- `revenue_entries` table — same idempotency anchor pattern
- `unmask_events` table — audit log for cost privacy unmask actions

Rename legacy `expenses`, `revenue` in `app.ts` to `legacy_*`.

### Module (file:artifacts/api-server/src/modules/finance/)

- `routes.ts` — all 11 endpoints mounted at `/api/v1/finance`
- `service.ts` — P&L CTE, auto-ledger handlers
- `privacy.ts` — `maskFinancials` middleware; session grant management

### Cost Privacy (Server-Side — R8)

- When `farm.cost_privacy_enabled = true` AND no active unmask grant: all `amountPesewas` fields replaced with `null` + `"financialsMasked": true` in response
- `POST /api/v1/finance/privacy/unmask` — sets session grant (default 300s TTL, max 3600s); writes `unmask_events` audit row
- Optional PIN: if `user_preferences.cost_privacy_pin` is set, PIN must be provided; wrong PIN → `401 PIN_REQUIRED`
- Grant stored in session (cookie-based); no Redis needed

### Auto-Ledger Consumers (all idempotent on `(source_event, source_ref_id)`)

| Event | Expense/Revenue | Category |
| --- | --- | --- |
| `STOCK_PURCHASED` | Expense | feed_and_nutrition / health_and_medicine / other_expenses |
| `HEALTH_TASK_COMPLETED` | Expense | health_and_medicine (intensive only) |
| `FEED_FORMULATION_CONFIRMED` | Expense | feed_and_nutrition (intensive only) |
| `BATCH_CREATED` | Expense | chicks_and_birds |
| `EGG_SALE_RECORDED` | Revenue | egg_sales |
| `BATCH_TERMINATED` (with sale) | Revenue | bird_sales / meat_sales |

Register consumers in file:artifacts/api-server/src/lib/jobs.ts CONSUMERS registry.

### P&L SQL CTE

Server-side CTE per file:specs/07_FINANCE.md §5.4. No client-side aggregation.

## Validation Refinements (Canonical Implementation)

- Cost privacy is per-user (`user_preferences.cost_privacy_enabled`), not farm-wide.
- Masked financial values are returned as `null` plus a privacy indicator; the API may not rely on client-side masking.
- The unmask grant must be persisted through the real auth session mechanism, not a transient request-only object.
- `BATCH_CREATED` auto-expense is conditional on batch creation capturing a purchase-cost field; otherwise chick purchase remains a manual finance entry.
- The ticket remains incomplete until server-side masking, persisted unmask grants, bird-sale validation, and SQL CTE P&L are closed.

## Acceptance Criteria

Privacy on, no grant → all amountPesewas fields are null in responsePOST /unmask → grant active → amounts visible for TTL durationUnmask writes one unmask_events rowRe-deliver STOCK_PURCHASED → only one expense row exists (idempotency)Semi-intensive HEALTH_TASK_COMPLETED → no expense row createdStock purchase of medications → health_and_medicine expense categoryBird sale qty > current population → 409 INSUFFICIENT_POPULATIONBird sale during active withdrawal → 409 WITHDRAWAL_ACTIVEP&L per-batch excludes null-batch entries; farm-wide includes bothROI when expenses = 0 → 0 (not division by zero)pnpm run typecheck passes
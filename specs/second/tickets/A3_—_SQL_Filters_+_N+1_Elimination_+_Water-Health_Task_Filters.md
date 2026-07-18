# A3 — SQL Filters + N+1 Elimination + Water-Health Task Filters

## Scope

Push all JavaScript-side filters into SQL `WHERE` clauses across Finance, Stock, Water-Health, and Feed. Fix Water-Health `listTasks` to apply its `week` and `status` filters and count both meat and egg withdrawals correctly.

### Included

**Finance (**file:artifacts/api-server/src/modules/finance/service.ts**):**

- `listExpenses`: push `from`, `to`, `batchId`, `category` into Drizzle `where()` using `gte`, `lte`, `eq`, `and`
- `listRevenue`: push `from`, `to`, `batchId`, `type` into Drizzle `where()`

**Stock (**file:artifacts/api-server/src/modules/stock/service.ts**):**

- `listItems`: push `category` filter into `where()`
- `listLots`: push `itemId` and `onHandOnly` (i.e. `gt(stockLots.qtyOnHand, 0)`) into `where()`

**Water-Health (**file:artifacts/api-server/src/modules/water-health/service.ts**):**

- `listMedications`: push `category` and `delivery_method` into `where()`
- `listTasks`: apply `week` filter (derive week from `scheduledDate`) and `status` filter in SQL
- `listTasks` withdrawal count: include rows where `withdrawalEggUntil >= today` in addition to `withdrawalMeatUntil >= today`

**Feed (**file:artifacts/api-server/src/modules/feed/service.ts**):**

- `listRequirements`: push `species` and `phase` into `where()`

**`resolveFarmMiddleware`**** (file:artifacts/api-server/src/routes/index.ts):**

- Add a middleware on the v1 router that resolves `farmId` once from `farmsTable` and attaches it to `req.farmId`
- All module routes that currently call `userFarmIds` or `resolveFarmId` individually should read `req.farmId` instead

### Explicitly out

- Changes to frontend pages
- Changes to the batch module (it uses `userFarmIds` correctly for multi-farm scoping)

## Why this is one ticket

All fixes follow the same pattern: replace a JavaScript filter with a SQL `WHERE` clause. They can be implemented in a single pass across the service files.

## Acceptance criteria

- `GET /api/v1/finance/expenses?from=2025-01-01&to=2025-03-31&category=feed` returns only rows matching all three filters — verified by checking the Drizzle query, not by counting JS iterations
- `GET /api/v1/stock/lots?itemId=X&onHandOnly=true` returns only lots for item X with `qty_on_hand > 0`
- `GET /api/v1/health/batches/:id/tasks?status=scheduled` returns only scheduled tasks
- `GET /api/v1/health/batches/:id/tasks` `active_withdrawal_count` includes tasks where `withdrawal_egg_until >= today`
- `GET /api/v1/feed/requirements?species=broiler&phase=starter` returns only matching rows
- No module route calls `resolveFarmId()` or `userFarmIds()` individually — all read `req.farmId` from middleware
- TypeScript compiles without errors — `req.farmId` is typed via the Express namespace augmentation
- The batch module is unaffected — it continues to use `userFarmIds` for multi-farm scoping and does not read `req.farmId`

## Dependencies

None — can start immediately.

## Plan reference

spec:3a092065-e868-4799-849c-f707a0553261/ecd0ec8f-4fe6-44c2-afee-fa2592de59b8 — issues 14–25.
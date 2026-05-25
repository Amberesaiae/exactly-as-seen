# A4 — Rate Limiter Replacement + Missing DB Indexes

## Scope

Replace the in-process rate limiter with `express-rate-limit` and add two additive indexes to the schema.

### Included

**Rate limiter (**file:artifacts/api-server/src/app.ts**):**

- Remove `rateLimitMap` and the hand-rolled `rateLimit()` function (lines 15–48)
- Install `express-rate-limit` (add to file:artifacts/api-server/package.json)
- Apply `rateLimit({ windowMs: 60_000, max: 20 })` to auth endpoints (`/api/login`, `/api/callback`, `/api/mobile-auth`)
- Apply `rateLimit({ windowMs: 60_000, max: 120 })` to mutating v1 endpoints (POST/PATCH/DELETE on `/api/v1/*`)
- Apply the same mutating limit to legacy routes while they remain mounted

**DB indexes (**file:lib/db/src/schema/water-health.ts** and **file:lib/db/src/schema/stock.ts**):**

- Add composite index on `health_tasks (farm_id, batch_id, status, scheduled_date)` — covers `listTasks`, `getWithdrawals`, and `generateDailyBatchTasks` queries
- Add partial index on `stock_lots (farm_id, item_id, qty_on_hand) WHERE qty_on_hand > 0 AND quality_grade <> 'damaged'` — covers the FIFO allocator query

### Explicitly out

- Redis-based distributed rate limiting (deferred to future ops hardening)
- Changes to business logic

## Why these are one ticket

Both are pure infrastructure changes with no business logic impact. Neither has dependencies on other tickets.

## Acceptance criteria

- `express-rate-limit` is the only rate limiting mechanism — no `rateLimitMap` remains in `app.ts`
- Auth endpoints return `429 Too Many Requests` after 20 requests per minute per IP
- Mutating API endpoints return `429` after 120 requests per minute per IP
- Read-only GET endpoints are not rate limited
- Local development with `DEV_AUTH_BYPASS=true` is not accidentally blocked by rate limiting
- Both indexes are defined in the Drizzle schema and applied via `drizzle-kit push`

## Dependencies

None — can start immediately.

## Plan reference

spec:3a092065-e868-4799-849c-f707a0553261/ecd0ec8f-4fe6-44c2-afee-fa2592de59b8 — issues 27, 34, 35. Also covers ticket:3a092065-e868-4799-849c-f707a0553261/1882dfa1-d3ba-4336-ac92-88a0fbae4f56 (Residual 4).
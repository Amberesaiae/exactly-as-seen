# Finance

**Status:** Spec v2 (rewritten 2026-05-03)
**Module path:** `artifacts/api-server/src/modules/finance`
**Owner:** TBD

> Conventions: see `00_CONVENTIONS.md`. Money handling per §4.2 (pesewas).

---

## 1. Purpose & Scope

Single ledger for all farm cash flows. Auto-records expenses from operational events, supports manual entries, computes per-batch and per-farm P&L, and enforces server-side cost privacy.

**In scope:** expense ledger, revenue ledger, P&L queries, sales-estimate helpers, cost-privacy enforcement.
**Out of scope:** bank reconciliation, invoicing, multi-currency conversion (per-farm currency only — CONVENTIONS §4.3), tax computation.

---

## 2. Domain Model

### 2.1 Expense categories (9 — canonical)

```ts
export type ExpenseCategory =
  | 'feed_and_nutrition'      // 🌾 — feed ingredients, finished feed, formulations
  | 'health_and_medicine'     // 💊 — meds, vaccines, vet fees
  | 'labor_and_workers'       // 👷 — wages, casual labor
  | 'utilities_and_services'  // ⚡ — electricity, water, generator fuel
  | 'equipment_and_tools'     // 🔧 — drinkers, feeders, repairs (capex + maint.)
  | 'transport_and_delivery'  // 🚛 — fuel, market transport
  | 'housing_and_facilities'  // 🏠 — coop construction, repairs
  | 'chicks_and_birds'        // 🐣 — initial chick purchase, replacements
  | 'other_expenses';         // 🧾 — bedding, pest control, licenses
```

### 2.2 Revenue types (5 — canonical)

```ts
export type RevenueType =
  | 'egg_sales'      // layers, ducks (layer-type)
  | 'bird_sales'     // live bird sale (auto-deducts batch population)
  | 'meat_sales'     // dressed/processed by weight
  | 'manure_sales'
  | 'other_revenue';
```

### 2.3 Entities

```ts
export interface ExpenseEntry {
  id: string;
  farmId: string;
  batchId: string | null;          // null = farm-wide
  category: ExpenseCategory;
  amountPesewas: number;
  description: string;
  occurredOn: string;              // YYYY-MM-DD, farm tz
  source: 'manual' | 'auto:stock' | 'auto:health' | 'auto:feed' | 'auto:batch';
  sourceEvent: string | null;      // event id
  sourceRefId: string | null;      // health_task_id, lot_id, etc.
  recordedBy: string;
  recordedAt: string;
  updatedAt: string;
}

export interface RevenueEntry {
  id: string;
  farmId: string;
  batchId: string | null;
  type: RevenueType;
  amountPesewas: number;
  qty: number;                     // units depend on type (crates, birds, kg, bags...)
  unit: string;                    // 'crate', 'bird', 'kg', 'bag', 'unit'
  description: string;
  buyerName: string | null;
  paymentMethod: 'cash' | 'mobile_money' | 'bank_transfer' | 'credit';
  occurredOn: string;
  source: 'manual' | 'auto:eggs' | 'auto:batch';
  sourceEvent: string | null;
  sourceRefId: string | null;
  recordedBy: string;
  recordedAt: string;
}

export interface BatchPnL {
  batchId: string;
  rangeFrom: string | null;
  rangeTo: string | null;
  totalExpensesPesewas: number;
  totalRevenuePesewas: number;
  netProfitPesewas: number;        // revenue - expenses
  roiPct: number;                  // net / expenses × 100; 0 when expenses=0
  byCategory: Record<ExpenseCategory, number>;
  byRevenueType: Record<RevenueType, number>;
}
```

---

## 3. Drizzle Schema

```ts
import { pgTable, text, integer, date, timestamp, index, check } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const expenseEntries = pgTable('expense_entries', {
  id: text('id').primaryKey(),
  farmId: text('farm_id').notNull(),
  batchId: text('batch_id'),
  category: text('category').notNull(),
  amountPesewas: integer('amount_pesewas').notNull(),
  description: text('description').notNull(),
  occurredOn: date('occurred_on').notNull(),
  source: text('source').notNull(),
  sourceEvent: text('source_event'),
  sourceRefId: text('source_ref_id'),
  recordedBy: text('recorded_by').notNull(),
  recordedAt: timestamp('recorded_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  byFarm: index('idx_expenses_farm_date').on(t.farmId, t.occurredOn),
  byBatch: index('idx_expenses_batch_date').on(t.batchId, t.occurredOn),
  byCategory: index('idx_expenses_category').on(t.farmId, t.category),
  uniqSourceRef: index('idx_expenses_source_ref').on(t.sourceEvent, t.sourceRefId),
  amountPositive: check('expenses_amount_nonneg', sql`amount_pesewas >= 0`),
}));

export const revenueEntries = pgTable('revenue_entries', {
  id: text('id').primaryKey(),
  farmId: text('farm_id').notNull(),
  batchId: text('batch_id'),
  type: text('type').notNull(),
  amountPesewas: integer('amount_pesewas').notNull(),
  qty: integer('qty').notNull(),
  unit: text('unit').notNull(),
  description: text('description').notNull(),
  buyerName: text('buyer_name'),
  paymentMethod: text('payment_method').notNull(),
  occurredOn: date('occurred_on').notNull(),
  source: text('source').notNull(),
  sourceEvent: text('source_event'),
  sourceRefId: text('source_ref_id'),
  recordedBy: text('recorded_by').notNull(),
  recordedAt: timestamp('recorded_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  byFarm: index('idx_revenue_farm_date').on(t.farmId, t.occurredOn),
  byBatch: index('idx_revenue_batch_date').on(t.batchId, t.occurredOn),
  byType: index('idx_revenue_type').on(t.farmId, t.type),
  uniqSourceRef: index('idx_revenue_source_ref').on(t.sourceEvent, t.sourceRefId),
  amountPositive: check('revenue_amount_nonneg', sql`amount_pesewas >= 0`),
}));
```

`(source_event, source_ref_id)` is the **idempotency anchor** for auto-entries. Worker upserts on this pair to avoid duplicates if an event is re-delivered.

---

## 4. State Machine

No FSM. Entries are immutable except for description / category corrections within 24 h (rule R10).

---

## 5. Public API

### 5.1 Zod schemas

```ts
import { z } from 'zod';

export const ExpenseCategorySchema = z.enum([
  'feed_and_nutrition','health_and_medicine','labor_and_workers',
  'utilities_and_services','equipment_and_tools','transport_and_delivery',
  'housing_and_facilities','chicks_and_birds','other_expenses',
]);
export const RevenueTypeSchema = z.enum([
  'egg_sales','bird_sales','meat_sales','manure_sales','other_revenue',
]);
export const PaymentMethodSchema = z.enum(['cash','mobile_money','bank_transfer','credit']);

export const CreateExpenseBody = z.object({
  category: ExpenseCategorySchema,
  amountPesewas: z.number().int().nonnegative(),
  description: z.string().min(1).max(240),
  occurredOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  batchId: z.string().uuid().nullable().optional(),
});

export const CreateRevenueBody = z.object({
  type: RevenueTypeSchema,
  amountPesewas: z.number().int().nonnegative(),
  qty: z.number().int().positive(),
  unit: z.string().min(1).max(20),
  description: z.string().min(1).max(240),
  buyerName: z.string().max(120).nullable().optional(),
  paymentMethod: PaymentMethodSchema,
  occurredOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  batchId: z.string().uuid().nullable().optional(),
});

export const ListQuery = z.object({
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  batchId: z.string().uuid().optional(),
  category: ExpenseCategorySchema.optional(),
  type: RevenueTypeSchema.optional(),
  cursor: z.string().optional(),
  limit: z.number().int().min(1).max(200).default(50),
});

export const TogglePrivacyBody = z.object({
  costPrivacyEnabled: z.boolean(),
  unmaskTtlSeconds: z.number().int().min(60).max(3600).optional(),
});
```

### 5.2 Endpoints

| Method | Path | Body / Query | Response |
|---|---|---|---|
| `GET` | `/finance/expenses` | `ListQuery` | `{ items: ExpenseEntry[], nextCursor }` |
| `POST` | `/finance/expenses` | `CreateExpenseBody` | `ExpenseEntry` |
| `PATCH` | `/finance/expenses/:id` | `CreateExpenseBody.partial()` | `ExpenseEntry` (within 24 h, manual only) |
| `DELETE` | `/finance/expenses/:id` | — | `204` (within 24 h, manual only) |
| `GET` | `/finance/revenue` | `ListQuery` | `{ items: RevenueEntry[], nextCursor }` |
| `POST` | `/finance/revenue` | `CreateRevenueBody` | `RevenueEntry` (bird-sales emits `BIRD_SALE_RECORDED`) |
| `PATCH` | `/finance/revenue/:id` | partial | `RevenueEntry` (within 24 h, manual only) |
| `GET` | `/finance/pnl/farm?from=&to=` | — | `BatchPnL` (with `batchId=null`) |
| `GET` | `/finance/pnl/batch/:batchId?from=&to=` | — | `BatchPnL` |
| `GET` | `/finance/summary?period=month\|week\|all` | — | `{ expenses, revenue, net, roiPct }` |
| `POST` | `/finance/privacy/toggle` | `TogglePrivacyBody` | `{ costPrivacyEnabled: boolean, unmaskedUntil: string \| null }` |
| `POST` | `/finance/privacy/unmask` | `{ ttlSeconds?: number, pin?: string }` | `{ unmaskedUntil: string }` |

### 5.3 Cost privacy enforcement

Cost privacy is a **server-side** concern. Toggle state lives on `farms.cost_privacy_enabled` (boolean) plus a per-session unmask grant.

- When `cost_privacy_enabled = true` AND the request has no active unmask grant:
  - All `amountPesewas` fields, `pricePer*Pesewas` fields, ROI, profit, and aggregated totals are replaced with the literal string `"●●●●"` in the response (responses are already JSON; the field becomes a string sentinel) **OR** the field is omitted and the response includes `"masked": true`.
  - Charts return only structure (labels, dates) — series values are nulled.
- The eye-icon "tap to reveal" issues `POST /finance/privacy/unmask` which sets a session grant valid for `ttlSeconds` (default 300 s, max 3600 s). The grant lives in the server session (keyed by `(user_id, session_id)`).
- An optional 4-digit PIN (set in user settings) gates `unmask`. If PIN is configured and not supplied / wrong → `401 PIN_REQUIRED`.
- Streamed exports (`08_RECORDS.md` §6) honour the same flag: PDFs/CSVs omit financial columns when masked.
- Audit log entry written on every unmask (`unmask_event` table) with `user_id`, `farm_id`, `at`, `ttl`, `pin_used`.

```ts
// Express middleware sketch
export const maskFinancials = (req: Req, res: Res, next: Next) => {
  res.locals.financialMaskActive = req.farm.costPrivacyEnabled && !req.session.unmaskedUntil?.gt(now());
  next();
};
```

### 5.4 P&L SQL (CTE)

```sql
WITH expenses AS (
  SELECT category, COALESCE(SUM(amount_pesewas), 0) AS total
  FROM expense_entries
  WHERE farm_id = $1
    AND ($2::text IS NULL OR batch_id = $2)
    AND ($3::date IS NULL OR occurred_on >= $3)
    AND ($4::date IS NULL OR occurred_on <= $4)
  GROUP BY category
),
revenue AS (
  SELECT type, COALESCE(SUM(amount_pesewas), 0) AS total
  FROM revenue_entries
  WHERE farm_id = $1
    AND ($2::text IS NULL OR batch_id = $2)
    AND ($3::date IS NULL OR occurred_on >= $3)
    AND ($4::date IS NULL OR occurred_on <= $4)
  GROUP BY type
)
SELECT
  (SELECT COALESCE(SUM(total),0) FROM expenses) AS total_expenses,
  (SELECT COALESCE(SUM(total),0) FROM revenue)  AS total_revenue,
  (SELECT json_object_agg(category, total) FROM expenses) AS by_category,
  (SELECT json_object_agg(type, total)     FROM revenue)  AS by_revenue_type;
```

---

## 6. Events

### 6.1 Published

```ts
export interface ExpenseRecordedV1 {
  type: 'EXPENSE_RECORDED';
  v: 1;
  expenseId: string;
  farmId: string;
  batchId: string | null;
  category: ExpenseCategory;
  amountPesewas: number;
  source: ExpenseEntry['source'];
}

export interface RevenueRecordedV1 {
  type: 'REVENUE_RECORDED';
  v: 1;
  revenueId: string;
  farmId: string;
  batchId: string | null;
  revenueType: RevenueType;
  amountPesewas: number;
}

export interface BirdSaleRecordedV1 {
  type: 'BIRD_SALE_RECORDED';
  v: 1;
  revenueId: string;
  farmId: string;
  batchId: string;
  qtyBirds: number;
  amountPesewas: number;
}
```

### 6.2 Consumed (auto-ledger map)

| Event | From | Action | Idempotency anchor |
|---|---|---|---|
| `STOCK_PURCHASED` | `06_STOCK_MANAGEMENT.md` | Create expense. Category derived from item category: `feed_ingredients`/`finished_feed` → `feed_and_nutrition`; `medications`/`vaccines` → `health_and_medicine`; `supplies` → `other_expenses` (or `equipment_and_tools` if explicitly equipment SKU — but equipment isn't in stock, so this branch is N/A). Amount = `totalCostPesewas`. Description = `"{itemName} — {qty} {unit}"`. Source `auto:stock`. | `(STOCK_PURCHASED, lotId)` |
| `HEALTH_TASK_COMPLETED` | `04_WATER_HEALTH.md` | Create expense. Category `health_and_medicine`. Amount = `qtyUsed × medication.unitCostPesewas` resolved at completion. Source `auto:health`. Skipped when batch `production_system='semi_intensive'` (manual entry expected). | `(HEALTH_TASK_COMPLETED, taskId)` |
| `FEED_FORMULATION_USED` | `03_FEED_CALCULATOR.md` | Create expense. Category `feed_and_nutrition`. Amount = sum of allocated lot costs (from Stock allocation event payload). Source `auto:feed`. Intensive only. | `(FEED_FORMULATION_USED, formulationId)` |
| `BATCH_CREATED` | `02_BATCH_MANAGEMENT.md` | Create expense `chicks_and_birds`. Amount = `chickPurchaseTotalPesewas`. Source `auto:batch`. | `(BATCH_CREATED, batchId)` |
| `EGG_SALE_RECORDED` | `05_EGG_PRODUCTION.md` | Create revenue `egg_sales`. Amount = `totalRevenuePesewas`. Source `auto:eggs`. Patches `egg_sales.ledger_entry_id` with the new revenue id. | `(EGG_SALE_RECORDED, saleId)` |
| `BATCH_TERMINATED` (with `terminationKind='sale'`) | `02_BATCH_MANAGEMENT.md` | If termination payload includes `saleRevenuePesewas > 0`, create revenue `bird_sales` (or `meat_sales` per `saleKind`). Source `auto:batch`. | `(BATCH_TERMINATED, batchId)` |

All consumers run as pg-boss workers reading from the pg-boss outbox queue.

---

## 7. Background Jobs

| Job | Schedule / trigger | Purpose |
|---|---|---|
| `auto-expense-stock` | event-driven `STOCK_PURCHASED` | Insert expense row. |
| `auto-expense-health` | event-driven `HEALTH_TASK_COMPLETED` | Insert expense row (intensive only). |
| `auto-expense-feed` | event-driven `FEED_FORMULATION_USED` | Insert expense row. |
| `auto-expense-batch-created` | event-driven `BATCH_CREATED` | Insert chick purchase expense. |
| `auto-revenue-eggs` | event-driven `EGG_SALE_RECORDED` | Insert revenue + back-patch sale row. |
| `auto-revenue-termination` | event-driven `BATCH_TERMINATED` | Insert revenue when sale payload present. |

Worker stub:

```ts
import PgBoss from 'pg-boss';
import { db, expenseEntries } from '@workspace/db';
import { uuidv7 } from '@workspace/shared/ids';

export async function stockExpenseHandler(job: PgBoss.Job<StockPurchasedV1>) {
  const e = job.data;
  const category =
    e.category === 'feed_ingredients' || e.category === 'finished_feed' ? 'feed_and_nutrition'
    : e.category === 'medications' || e.category === 'vaccines' ? 'health_and_medicine'
    : 'other_expenses';

  await db.insert(expenseEntries).values({
    id: uuidv7(),
    farmId: e.farmId,
    batchId: null,
    category,
    amountPesewas: e.totalCostPesewas,
    description: `${e.itemName} — ${e.qty} ${e.unit}`,
    occurredOn: e.receivedAt.slice(0, 10),
    source: 'auto:stock',
    sourceEvent: e.type,
    sourceRefId: e.lotId,
    recordedBy: 'system',
  }).onConflictDoNothing({ target: [expenseEntries.sourceEvent, expenseEntries.sourceRefId] });
}
```

---

## 8. Business Rules & Invariants

- **R1 — 9 expense categories.** Exactly the nine values in §2.1; no others accepted.
- **R2 — 5 revenue types.** Exactly the five values in §2.2.
- **R3 — Pesewas only.** All money is integer pesewas (CONVENTIONS §4.2). Float input → 400.
- **R4 — Currency.** All responses include implicit `farm.currency` for display layer (CONVENTIONS §4.3); the stored value is currency-agnostic (one farm, one currency).
- **R5 — Auto-ledger idempotency.** Every auto-handler upserts on `(source_event, source_ref_id)`. Replays are safe.
- **R6 — Pattern gate.** `auto:health` and `auto:feed` only fire for batches with `production_system='intensive'`. Semi-intensive batches require manual entry.
- **R7 — Auto-categorisation.** Stock-derived expenses map category by item category (table in §6.2). Bird/chick purchases at batch creation map to `chicks_and_birds`.
- **R8 — Cost privacy server-side.** When `farm.cost_privacy_enabled` is true and no active unmask grant, all monetary fields are masked (§5.3). Frontend may not unmask on its own; it must request a grant.
- **R9 — Unmask audit.** Every successful unmask writes an `unmask_event` row.
- **R10 — Edit window.** `PATCH` / `DELETE` allowed only on entries with `source='manual'` and within 24 h of `recorded_at`. Auto entries are never editable; correction is by recording an opposite (negative) entry, which is **not** allowed (amounts must be ≥0). Instead, the operator must reverse the source action (e.g. un-complete the health task).
- **R11 — Bird sale population sync.** `POST /finance/revenue` with `type='bird_sales'` and a `batchId` emits `BIRD_SALE_RECORDED`. `02_BATCH_MANAGEMENT.md` consumes it and decrements `batches.population` by `qty`. Validation: `qty <= currentPopulation` else `409 INSUFFICIENT_POPULATION`.
- **R12 — Date range.** P&L queries default to "all time" if no `from`/`to`. Range is inclusive on both sides; uses `occurred_on` (not `recorded_at`).
- **R13 — Per-batch P&L.** `GET /finance/pnl/batch/:batchId` filters on `batch_id = :batchId`; farm-wide expenses (`batch_id IS NULL`) are **not** included.
- **R14 — Per-farm P&L.** `GET /finance/pnl/farm` aggregates everything for the farm, including null-batch entries.
- **R15 — ROI math.** `roiPct = totalExpenses === 0 ? 0 : round((netProfit / totalExpenses) × 10000) / 100` (2 decimals).
- **R16 — Authorization.** Every query includes `farm_id` (CONVENTIONS §4.9). Cross-farm access prohibited.
- **R17 — Idempotency-Key.** Required on all writes (CONVENTIONS §4.5). Client uses uuidv7.
- **R18 — Withdrawal-period sales.** Bird/meat sales for a batch with active meat withdrawal return `409 WITHDRAWAL_ACTIVE` (cross-check against `04_WATER_HEALTH.md`).
- **R19 — Termination revenue.** `BATCH_TERMINATED` with `terminationKind='sale'` and a positive `saleRevenuePesewas` creates exactly one revenue row of type `bird_sales` or `meat_sales` per the payload. Termination without sale → no revenue row.

---

## 9. Error Codes

| Code | HTTP | Meaning |
|---|---|---|
| `EXPENSE_NOT_FOUND` | 404 | |
| `REVENUE_NOT_FOUND` | 404 | |
| `EDIT_WINDOW_EXPIRED` | 409 | Past 24 h or non-manual. |
| `AUTO_ENTRY_IMMUTABLE` | 409 | PATCH on `source != 'manual'`. |
| `INVALID_CATEGORY` | 400 | |
| `INVALID_REVENUE_TYPE` | 400 | |
| `WITHDRAWAL_ACTIVE` | 409 | Bird/meat sale during withdrawal. |
| `INSUFFICIENT_POPULATION` | 409 | Bird sale exceeds current population. |
| `PIN_REQUIRED` | 401 | Unmask without PIN when PIN configured. |
| `MASKED` | 200 | Not an error; flag in payload. |

---

## 10. Observability

Log fields: `farm_id`, `batch_id`, `category`/`type`, `source`, `source_event`, `source_ref_id`, `amount_pesewas`. Metrics:

- `finance_expense_recorded_total{category,source}`
- `finance_revenue_recorded_total{type,source}`
- `finance_unmask_total{pin_used}`
- `finance_pnl_query_duration_ms` (histogram)

---

## 11. Test Plan

- R1 / R2: invalid category/type → 400.
- R3: float amount → 400.
- R5: re-deliver `STOCK_PURCHASED` — only one expense row exists.
- R6: semi-intensive `HEALTH_TASK_COMPLETED` → no expense row.
- R7: stock purchase of `medications` creates `health_and_medicine` expense.
- R8: privacy on, no grant → response shows `"●●●●"` for amounts.
- R9: unmask writes audit row.
- R10: edit auto-entry → 409.
- R11: bird sale qty > population → 409; valid → batch population decremented (assert via Batch fixture).
- R13/R14: per-batch P&L excludes farm-wide; per-farm includes both.
- R15: ROI when expenses = 0 → 0.
- R18: bird sale during withdrawal → 409.
- R19: termination with sale creates one revenue row idempotently.

---

## 12. Open Questions

- Refunds: do we model them as negative entries or as separate `refund` source? Currently disallowed (R10).
- Multi-currency: cross-farm consolidated reporting is out of scope; revisit if multi-farm owners ask.
- PIN policy: 4-digit PIN sufficient, or biometric on mobile? Frontend concern.

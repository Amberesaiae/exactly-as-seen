# Stock Management

**Status:** Spec v2 (rewritten 2026-05-03)
**Module path:** `artifacts/api-server/src/modules/stock`
**Owner:** TBD

> Conventions: see `00_CONVENTIONS.md`. Allocation algorithm follows §2.15.

---

## 1. Purpose & Scope

Lot-tracked inventory of all consumable farm supplies. Provides:

- Recording of purchases (with auto-expense in `07_FINANCE.md`).
- Per-lot expiry & quality tracking.
- FIFO-by-quality auto-allocation triggered by other modules' completion events.
- Real-time availability queries for the Feed Calculator (`03_FEED_CALCULATOR.md`).
- Low-stock alerts.

**In scope:** lots, allocations, consumption, transfers, suppliers.
**Out of scope:** purchase orders / approval workflows; barcode scanning hardware.

---

## 2. Domain Model

### 2.1 Categories (5 — canonical)

```ts
export type StockCategory =
  | 'feed_ingredients'   // maize, soybean meal, fish meal, PKC, bran, etc. — bag-based
  | 'finished_feed'      // purchased complete feed bags (starter/grower/finisher)
  | 'medications'        // amprolium, oxytetracycline, tylosin, fenbendazole...
  | 'vaccines'           // gumboro, lasota, fowl pox, duck hepatitis...
  | 'supplies';          // multivitamins, electrolytes, glucose, calcium, bedding, gloves
```

(Equipment is **not** stock — it is a one-shot capex expense in Finance §2.)

### 2.2 Quality grades

```ts
export type QualityGrade = 'A' | 'B' | 'C' | 'damaged';
```

`A` = pristine; `B` = acceptable; `C` = use-soon; `damaged` = excluded from auto-allocation (CONVENTIONS §2.15).

### 2.3 Entities

```ts
export interface StockItem {
  id: string;
  farmId: string;
  category: StockCategory;
  name: string;                    // canonical: 'maize', 'amprolium_20pct'
  displayName: string;
  unit: 'bag_50kg' | 'kg' | 'g' | 'ml' | 'l' | 'vial' | 'sachet' | 'tablet' | 'piece';
  reorderThreshold: number;        // in `unit`
  defaultStorageLocationId: string | null;
  createdAt: string;
}

export interface StockLot {
  id: string;
  farmId: string;
  itemId: string;
  supplierId: string | null;
  qtyReceived: number;             // in item.unit
  qtyOnHand: number;               // decremented on allocation
  unitCostPesewas: number;         // §4.2
  qualityGrade: QualityGrade;
  expiryDate: string | null;       // null for non-perishables (e.g. ingredients with no clear expiry)
  receivedAt: string;
  storageLocationId: string | null;
  notes: string | null;
}

export interface StockAllocation {
  id: string;
  farmId: string;
  lotId: string;
  batchId: string | null;          // farm-wide if null
  qty: number;
  reason: 'feed_use' | 'health_task' | 'manual' | 'transfer' | 'reserve';
  sourceEvent: string | null;      // event id that caused auto-allocation
  sourceRefId: string | null;      // health_task_id or feed_formulation_id
  allocatedAt: string;
  reversedAt: string | null;       // soft-reverse on event compensation
  reversedReason: string | null;
}

export interface Supplier {
  id: string;
  farmId: string;
  name: string;
  phone: string | null;
  notes: string | null;
}
```

---

## 3. Drizzle Schema

```ts
import { pgTable, text, integer, timestamp, date, index, uniqueIndex } from 'drizzle-orm/pg-core';

export const suppliers = pgTable('suppliers', {
  id: text('id').primaryKey(),
  farmId: text('farm_id').notNull(),
  name: text('name').notNull(),
  phone: text('phone'),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  byFarm: index('idx_suppliers_farm').on(t.farmId),
}));

export const stockItems = pgTable('stock_items', {
  id: text('id').primaryKey(),
  farmId: text('farm_id').notNull(),
  category: text('category').notNull(),
  name: text('name').notNull(),
  displayName: text('display_name').notNull(),
  unit: text('unit').notNull(),
  reorderThreshold: integer('reorder_threshold').notNull().default(0),
  defaultStorageLocationId: text('default_storage_location_id'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  uniqFarmName: uniqueIndex('uniq_stock_item_farm_name').on(t.farmId, t.name),
}));

export const stockLots = pgTable('stock_lots', {
  id: text('id').primaryKey(),
  farmId: text('farm_id').notNull(),
  itemId: text('item_id').notNull(),
  supplierId: text('supplier_id'),
  qtyReceived: integer('qty_received').notNull(),
  qtyOnHand: integer('qty_on_hand').notNull(),
  unitCostPesewas: integer('unit_cost_pesewas').notNull(),
  qualityGrade: text('quality_grade').notNull().default('A'),
  expiryDate: date('expiry_date'),
  receivedAt: timestamp('received_at', { withTimezone: true }).notNull(),
  storageLocationId: text('storage_location_id'),
  notes: text('notes'),
}, (t) => ({
  byItem: index('idx_stock_lots_item_onhand').on(t.itemId, t.qtyOnHand),
  byExpiry: index('idx_stock_lots_expiry').on(t.expiryDate),
  byFarm: index('idx_stock_lots_farm').on(t.farmId),
}));

export const stockAllocations = pgTable('stock_allocations', {
  id: text('id').primaryKey(),
  farmId: text('farm_id').notNull(),
  lotId: text('lot_id').notNull(),
  batchId: text('batch_id'),
  qty: integer('qty').notNull(),
  reason: text('reason').notNull(),
  sourceEvent: text('source_event'),
  sourceRefId: text('source_ref_id'),
  allocatedAt: timestamp('allocated_at', { withTimezone: true }).notNull().defaultNow(),
  reversedAt: timestamp('reversed_at', { withTimezone: true }),
  reversedReason: text('reversed_reason'),
}, (t) => ({
  byLot: index('idx_stock_alloc_lot').on(t.lotId),
  byBatch: index('idx_stock_alloc_batch').on(t.batchId),
  bySourceRef: index('idx_stock_alloc_source_ref').on(t.sourceRefId),
}));
```

---

## 4. State Machine

No FSM at the lot level — `qtyOnHand > 0` is "active", `0` is "depleted". Allocations may be reversed via `POST /stock/allocations/:id/reverse` (within 24 h or when a source event is compensated).

---

## 5. Public API

### 5.1 Zod schemas

```ts
import { z } from 'zod';

export const StockCategorySchema = z.enum(['feed_ingredients','finished_feed','medications','vaccines','supplies']);
export const QualityGradeSchema = z.enum(['A','B','C','damaged']);
export const StockUnitSchema = z.enum(['bag_50kg','kg','g','ml','l','vial','sachet','tablet','piece']);

export const CreatePurchaseBody = z.object({
  itemId: z.string().uuid().optional(),
  newItem: z.object({
    category: StockCategorySchema,
    name: z.string().min(1).max(80),
    displayName: z.string().min(1).max(120),
    unit: StockUnitSchema,
    reorderThreshold: z.number().int().nonnegative().default(0),
  }).optional(),
  qtyReceived: z.number().int().positive(),
  unitCostPesewas: z.number().int().nonnegative(),
  totalCostPesewas: z.number().int().nonnegative().optional(), // server validates total = unit*qty
  supplierId: z.string().uuid().nullable().optional(),
  qualityGrade: QualityGradeSchema.default('A'),
  expiryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  storageLocationId: z.string().uuid().nullable().optional(),
  notes: z.string().max(500).nullable().optional(),
}).refine(v => v.itemId || v.newItem, { message: 'itemId or newItem required' });

export const ManualAllocateBody = z.object({
  itemId: z.string().uuid(),
  qty: z.number().int().positive(),
  batchId: z.string().uuid().nullable().optional(),
  reason: z.enum(['manual','reserve']).default('manual'),
  preferredLotId: z.string().uuid().optional(),
});

export const ConsumptionBody = z.object({
  itemId: z.string().uuid(),
  qty: z.number().int().positive(),
  batchId: z.string().uuid().nullable().optional(),
  consumedAt: z.string().datetime().optional(),
  notes: z.string().max(500).nullable().optional(),
});

export const TransferBody = z.object({
  lotId: z.string().uuid(),
  qty: z.number().int().positive(),
  toStorageLocationId: z.string().uuid(),
});

export const AvailabilityQuery = z.object({
  itemNames: z.array(z.string()).min(1),
  expiryBufferDays: z.number().int().nonnegative().default(7),
  excludeGrades: z.array(QualityGradeSchema).default(['damaged']),
});
```

### 5.2 Endpoints

| Method | Path | Body | Response |
|---|---|---|---|
| `GET` | `/stock/items?category=` | — | `{ items: StockItem[] }` |
| `GET` | `/stock/items/:id` | — | `{ item: StockItem, lots: StockLot[], onHand: number }` |
| `POST` | `/stock/items` | `{ category, name, displayName, unit, reorderThreshold }` | `StockItem` |
| `PATCH` | `/stock/items/:id` | partial | `StockItem` |
| `POST` | `/stock/purchases` | `CreatePurchaseBody` | `{ lot: StockLot, item: StockItem, ledgerEntryId: string \| null }` |
| `GET` | `/stock/lots?itemId=&onHand=true` | — | `{ lots: StockLot[] }` |
| `POST` | `/stock/allocations` | `ManualAllocateBody` | `{ allocations: StockAllocation[] }` |
| `POST` | `/stock/allocations/:id/reverse` | `{ reason: string }` | `StockAllocation` |
| `POST` | `/stock/consumption` | `ConsumptionBody` | `{ allocations: StockAllocation[] }` (Flexible-pattern manual recording) |
| `POST` | `/stock/transfers` | `TransferBody` | `{ lot: StockLot }` |
| `GET` | `/stock/low-stock` | — | `{ items: { item: StockItem, onHand: number }[] }` |
| `POST` | `/stock/availability` | `AvailabilityQuery` | `{ [itemName]: { available: number, lots: StockLot[] } }` |
| `GET` | `/stock/suppliers` | — | `{ suppliers: Supplier[] }` |
| `POST` | `/stock/suppliers` | `{ name, phone?, notes? }` | `Supplier` |

### 5.3 Allocation algorithm (CONVENTIONS §2.15)

```ts
// Sort: damaged excluded; near-expiry first (≤30d), then expiry asc, then received_at asc.
export async function allocateFifoByQuality(
  tx: TxLike,
  farmId: string,
  itemId: string,
  qtyNeeded: number,
  ctx: { batchId: string | null; reason: StockAllocation['reason']; sourceEvent?: string; sourceRefId?: string },
): Promise<StockAllocation[]> {
  const lots = await tx.execute(sql`
    WITH eligible AS (
      SELECT *,
        CASE
          WHEN expiry_date IS NOT NULL AND expiry_date <= CURRENT_DATE + INTERVAL '30 days' THEN 0
          ELSE 1
        END AS expiry_bucket
      FROM stock_lots
      WHERE farm_id = ${farmId}
        AND item_id = ${itemId}
        AND quality_grade <> 'damaged'
        AND qty_on_hand > 0
        AND (expiry_date IS NULL OR expiry_date > CURRENT_DATE)
    )
    SELECT * FROM eligible
    ORDER BY expiry_bucket ASC, expiry_date ASC NULLS LAST, received_at ASC
    FOR UPDATE
  `);

  const out: StockAllocation[] = [];
  let remaining = qtyNeeded;
  for (const lot of lots.rows as StockLot[]) {
    if (remaining <= 0) break;
    const take = Math.min(lot.qtyOnHand, remaining);
    await tx.update(stockLots).set({ qtyOnHand: lot.qtyOnHand - take }).where(eq(stockLots.id, lot.id));
    out.push(await tx.insert(stockAllocations).values({
      id: uuidv7(), farmId, lotId: lot.id, batchId: ctx.batchId, qty: take,
      reason: ctx.reason, sourceEvent: ctx.sourceEvent ?? null, sourceRefId: ctx.sourceRefId ?? null,
    }).returning().then(r => r[0]));
    remaining -= take;
  }
  if (remaining > 0) throw new InsufficientStockError(itemId, qtyNeeded, qtyNeeded - remaining);
  return out;
}
```

---

## 6. Events

### 6.1 Published

```ts
export interface StockPurchasedV1 {
  type: 'STOCK_PURCHASED';
  v: 1;
  farmId: string;
  lotId: string;
  itemId: string;
  itemName: string;
  category: StockCategory;
  qty: number;
  unit: string;
  unitCostPesewas: number;
  totalCostPesewas: number;
  supplierId: string | null;
  receivedAt: string;
}

export interface StockAllocatedV1 {
  type: 'STOCK_ALLOCATED';
  v: 1;
  farmId: string;
  allocationIds: string[];
  itemId: string;
  qty: number;
  batchId: string | null;
  reason: StockAllocation['reason'];
  sourceEvent: string | null;
  sourceRefId: string | null;
}

export interface StockLowV1 {
  type: 'STOCK_LOW';
  v: 1;
  farmId: string;
  itemId: string;
  itemName: string;
  onHand: number;
  reorderThreshold: number;
}

export interface StockDepletedV1 {
  type: 'STOCK_DEPLETED';
  v: 1;
  farmId: string;
  itemId: string;
  itemName: string;
}

export interface StockExpiringV1 {
  type: 'STOCK_EXPIRING';
  v: 1;
  farmId: string;
  lotId: string;
  itemId: string;
  expiryDate: string;
  daysToExpiry: number;
}

export interface StockAllocationFailedV1 {
  type: 'STOCK_ALLOCATION_FAILED';
  v: 1;
  farmId: string;
  itemId: string;
  itemName: string;
  qtyNeeded: number;
  qtyAvailable: number;
  sourceEvent: string;
  sourceRefId: string;
}
```

### 6.2 Consumed

| Event | Published by | Reaction |
|---|---|---|
| `HEALTH_TASK_COMPLETED` | `04_WATER_HEALTH.md` | Resolve medication item from task; auto-allocate `qtyUsed`. Emit `STOCK_ALLOCATED` (or `STOCK_ALLOCATION_FAILED`). |
| `FEED_FORMULATION_USED` | `03_FEED_CALCULATOR.md` | For each ingredient line, auto-allocate. Atomic — if any line fails, reverse all and emit `STOCK_ALLOCATION_FAILED`. |
| `BATCH_CREATED` | `02_BATCH_MANAGEMENT.md` | No-op (chick purchase recorded directly via Finance, not stock). |
| `BATCH_TERMINATED` | `02_BATCH_MANAGEMENT.md` | Reverse open `reserve` allocations for that batch. |

Pattern gate (CONVENTIONS — Dual Pattern): auto-allocation only runs when batch `production_system = 'intensive'`. For `semi_intensive`, the event is observed but consumption requires manual `POST /stock/consumption`.

---

## 7. Background Jobs

| Job | Schedule (pg-boss) | Purpose |
|---|---|---|
| `stockExpiryScan` | `0 7 * * *` farm tz | Emit `STOCK_EXPIRING` for lots with `expiryDate <= today + 14d`. |
| `stockLowScan` | `0 6 * * *` farm tz | Emit `STOCK_LOW` for items where `SUM(qty_on_hand) < reorder_threshold`. |
| `stockAllocationReplay` | event-driven | Worker for `HEALTH_TASK_COMPLETED` and `FEED_FORMULATION_USED` outbox jobs. |

```ts
import PgBoss from 'pg-boss';
import { allocateForHealthTask } from './service';

export async function healthAllocHandler(job: PgBoss.Job<HealthTaskCompletedV1>) {
  return allocateForHealthTask(job.data);
}
```

---

## 8. Business Rules & Invariants

- **R1 — Five categories.** Only the five `StockCategory` values are valid. Equipment lives in Finance, not stock.
- **R2 — Lot immutability.** `qty_received`, `unit_cost_pesewas`, `expiry_date`, and `received_at` are immutable post-creation. Quality grade may be downgraded (A→B→C→damaged) only via `PATCH /stock/lots/:id/grade`.
- **R3 — Allocation algorithm.** Auto-allocation follows CONVENTIONS §2.15: near-expiry (≤30 d) bucket first, then `expiry_date ASC`, then `received_at ASC`. Lots with `quality_grade='damaged'` are excluded from auto-allocation.
- **R4 — Atomicity.** A single `STOCK_ALLOCATED` event corresponds to one allocation request and may span multiple lots. If insufficient stock, the entire request rolls back and `STOCK_ALLOCATION_FAILED` is emitted instead.
- **R5 — Non-negative.** `qty_on_hand >= 0` enforced by check constraint and `FOR UPDATE` row lock.
- **R6 — Auto-allocation triggers.** Triggered by `HEALTH_TASK_COMPLETED`, `FEED_FORMULATION_USED` only when the batch's `production_system = 'intensive'`.
- **R7 — Auto-expense.** Every `STOCK_PURCHASED` triggers a Finance expense (see `07_FINANCE.md` §6) — both intensive and semi-intensive (purchases are real cash outflows regardless of pattern).
- **R8 — Low-stock threshold.** Per-item `reorder_threshold`; `STOCK_LOW` emitted at most once per (item, day) (job is idempotent via dedup key `low:{itemId}:{date}`).
- **R9 — Expiry exclusion.** Lots with `expiry_date <= CURRENT_DATE` are excluded from availability and auto-allocation. They must be manually written off.
- **R10 — Availability query.** `POST /stock/availability` returns sum of `qty_on_hand` per item across all lots that pass: `quality_grade NOT IN excludeGrades`, expiry not past, expiry > `today + expiryBufferDays` (or null). Used by Feed Calculator pre-LP availability check.
- **R11 — Reverse window.** `POST /stock/allocations/:id/reverse` allowed within 24 h of `allocated_at`, OR programmatically at any time when triggered by a compensating event (e.g. health task un-completed).
- **R12 — Manual consumption (Flexible).** `POST /stock/consumption` records consumption for semi-intensive batches; same FIFO algorithm but `reason='manual'`.
- **R13 — Transfers.** Transfers between storage locations split a lot if `qty < lot.qtyOnHand`; new lot inherits all attributes except `storage_location_id` and a fresh `id`.
- **R14 — Idempotency.** All POSTs honour `Idempotency-Key`. Auto-allocation jobs key on `(sourceEvent, sourceRefId)`.
- **R15 — Currency.** All money in pesewas (CONVENTIONS §4.2). `farm.currency` honoured at display.
- **R16 — Cost privacy.** `unit_cost_pesewas` and lot value totals stripped from responses when `farm.cost_privacy_enabled` (see `07_FINANCE.md` §5.3).
- **R17 — Authorization.** Every query filters by `farm_id` (CONVENTIONS §4.9).

---

## 9. Error Codes

| Code | HTTP | Meaning |
|---|---|---|
| `STOCK_INSUFFICIENT` | 409 | Allocation cannot be satisfied. |
| `STOCK_ITEM_NOT_FOUND` | 404 | |
| `STOCK_LOT_EXPIRED` | 409 | Manual allocate of expired lot. |
| `STOCK_LOT_DAMAGED` | 409 | Manual allocate of damaged lot without override. |
| `STOCK_REVERSE_WINDOW_EXPIRED` | 409 | |
| `STOCK_DUPLICATE_ITEM_NAME` | 409 | |
| `STOCK_INVALID_TOTAL` | 400 | `totalCostPesewas !== qty * unitCost`. |

---

## 10. Observability

Log fields: `farm_id`, `item_id`, `lot_id`, `qty`, `reason`, `source_event`, `source_ref_id`. Metrics:

- `stock_allocation_total{reason}` (counter)
- `stock_allocation_failed_total{reason}` (counter)
- `stock_lot_qty_on_hand{item}` (gauge, exported nightly)
- `stock_low_alerts_total`
- `stock_purchase_total_pesewas` (counter)

---

## 11. Test Plan

- R1: `category='equipment'` → 400.
- R2: PATCH `qty_received` → 409.
- R3: lots with grade B + 5d expiry win over grade A + 60d expiry (near-expiry bucket).
- R3: damaged lot excluded from auto, available via manual override only.
- R4: `FEED_FORMULATION_USED` with 3 ingredients where one is short — all rolled back, `STOCK_ALLOCATION_FAILED` emitted.
- R5: concurrent allocations don't overdraw (use `pg_advisory_xact_lock` test or transactional retry).
- R6: semi-intensive batch — `HEALTH_TASK_COMPLETED` produces no auto-allocation.
- R7: `STOCK_PURCHASED` → Finance ledger entry created (assert via Finance fixture).
- R8: low-stock dedup within same day.
- R10: availability query with `expiryBufferDays=7` excludes 5-day-out lot.
- R11: reverse outside 24 h → 409 unless event-triggered.
- R14: replay same `(sourceEvent, sourceRefId)` is no-op.

---

## 12. Open Questions

- Multi-farm shared inventory? Currently strictly farm-scoped.
- Negative lots after physical recount — do we model "stock count adjustment" as a special allocation reason? Proposed for v1.1.
- Bag splitting: when an ingredient is consumed in kg but stocked in `bag_50kg`, the unit conversion currently lives in the Feed Calculator. Should it move here? See `03_FEED_CALCULATOR.md` Open Q.

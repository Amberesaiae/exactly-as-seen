# Egg Production

**Status:** Spec v2 (rewritten 2026-05-03)
**Module path:** `artifacts/api-server/src/modules/egg-production`
**Owner:** TBD

> Conventions: see `00_CONVENTIONS.md`. This spec only adds module-specific rules. Cross-system events and money handling follow §4 there.

---

## 1. Purpose & Scope

Tracks daily egg collection, grading, inventory, discards, and sales for **layer chicken batches** and **layer-type duck batches** (`duck_type = 'layer'`). Publishes `EGG_*` events that the Finance module (`07_FINANCE.md`) and Records module (`08_RECORDS.md`) consume.

**In scope:**

- Daily collection records with grade breakdown (S / M / L / XL / cracked / dirty).
- Running egg inventory (collected − sold − discarded).
- Egg sales with auto-revenue ledger entry in Finance.
- Withdrawal-period guard (block sale; force discard) — see `04_WATER_HEALTH.md` §X for withdrawal source.

**Out of scope:**

- Broiler / turkey / `duck_type='meat'` batches — egg endpoints return `404 EGG_TRACKING_NOT_APPLICABLE`.
- Hatching / fertility tracking.
- Egg pricing engine (price per crate is a per-sale input).

---

## 2. Domain Model

```ts
export type EggGrade = 'small' | 'medium' | 'large' | 'xlarge' | 'cracked' | 'dirty';

export interface EggCollection {
  id: string;                // uuidv7
  farmId: string;
  batchId: string;
  collectionDate: string;    // ISO date in farm timezone (YYYY-MM-DD)
  smallCount: number;
  mediumCount: number;
  largeCount: number;
  xlargeCount: number;
  crackedCount: number;
  dirtyCount: number;
  totalCount: number;        // generated: sum of all grades
  goodCount: number;         // generated: S+M+L+XL
  populationAtCollection: number;
  productionRatePct: number; // generated: goodCount / population × 100
  notes: string | null;
  recordedBy: string;        // user id
  recordedAt: string;
  updatedAt: string;
}

export interface EggInventorySnapshot {
  batchId: string;
  goodEggsOnHand: number;        // collected good − sold − discarded
  cratesOnHand: number;          // floor(goodEggsOnHand / 30)
  loose: number;                 // goodEggsOnHand % 30
  lastUpdatedAt: string;
}

export interface EggDiscard {
  id: string;
  farmId: string;
  batchId: string;
  discardDate: string;
  count: number;
  reason: 'withdrawal' | 'spoilage' | 'breakage' | 'other';
  withdrawalRecordId: string | null;
  notes: string | null;
  recordedBy: string;
  recordedAt: string;
}

export interface EggSale {
  id: string;
  farmId: string;
  batchId: string;
  saleDate: string;
  cratesSold: number;            // 30 eggs per crate
  loosesSold: number;            // 0–29
  pricePerCratePesewas: number;  // §4.2
  pricePerLoosePesewas: number;  // computed pricePerCrate / 30, rounded
  totalRevenuePesewas: number;   // generated
  buyerName: string | null;
  paymentMethod: 'cash' | 'mobile_money' | 'bank_transfer' | 'credit';
  ledgerEntryId: string | null;  // FK after Finance creates the entry
  recordedBy: string;
  recordedAt: string;
}
```

---

## 3. Drizzle Schema

```ts
import { pgTable, text, integer, date, timestamp, jsonb, uniqueIndex, index } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const eggCollections = pgTable('egg_collections', {
  id: text('id').primaryKey(),
  farmId: text('farm_id').notNull(),
  batchId: text('batch_id').notNull(),
  collectionDate: date('collection_date').notNull(),
  smallCount: integer('small_count').notNull().default(0),
  mediumCount: integer('medium_count').notNull().default(0),
  largeCount: integer('large_count').notNull().default(0),
  xlargeCount: integer('xlarge_count').notNull().default(0),
  crackedCount: integer('cracked_count').notNull().default(0),
  dirtyCount: integer('dirty_count').notNull().default(0),
  totalCount: integer('total_count').generatedAlwaysAs(
    sql`small_count + medium_count + large_count + xlarge_count + cracked_count + dirty_count`,
  ).notNull(),
  goodCount: integer('good_count').generatedAlwaysAs(
    sql`small_count + medium_count + large_count + xlarge_count`,
  ).notNull(),
  populationAtCollection: integer('population_at_collection').notNull(),
  productionRateBp: integer('production_rate_bp').notNull(), // basis points (×100), rate × 100
  notes: text('notes'),
  recordedBy: text('recorded_by').notNull(),
  recordedAt: timestamp('recorded_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  uniqBatchDate: uniqueIndex('uniq_egg_collection_batch_date').on(t.batchId, t.collectionDate),
  byFarm: index('idx_egg_collections_farm').on(t.farmId, t.collectionDate),
}));

export const eggDiscards = pgTable('egg_discards', {
  id: text('id').primaryKey(),
  farmId: text('farm_id').notNull(),
  batchId: text('batch_id').notNull(),
  discardDate: date('discard_date').notNull(),
  count: integer('count').notNull(),
  reason: text('reason').notNull(), // 'withdrawal' | 'spoilage' | 'breakage' | 'other'
  withdrawalRecordId: text('withdrawal_record_id'),
  notes: text('notes'),
  recordedBy: text('recorded_by').notNull(),
  recordedAt: timestamp('recorded_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  byBatch: index('idx_egg_discards_batch').on(t.batchId, t.discardDate),
}));

export const eggSales = pgTable('egg_sales', {
  id: text('id').primaryKey(),
  farmId: text('farm_id').notNull(),
  batchId: text('batch_id').notNull(),
  saleDate: date('sale_date').notNull(),
  cratesSold: integer('crates_sold').notNull(),
  loosesSold: integer('looses_sold').notNull().default(0),
  pricePerCratePesewas: integer('price_per_crate_pesewas').notNull(),
  pricePerLoosePesewas: integer('price_per_loose_pesewas').notNull(),
  totalRevenuePesewas: integer('total_revenue_pesewas').notNull(),
  buyerName: text('buyer_name'),
  paymentMethod: text('payment_method').notNull(),
  ledgerEntryId: text('ledger_entry_id'),
  recordedBy: text('recorded_by').notNull(),
  recordedAt: timestamp('recorded_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  byBatch: index('idx_egg_sales_batch').on(t.batchId, t.saleDate),
}));
```

Inventory is **derived**, not stored. It is computed by the read query in §5.4 (a `BatchEggInventoryView` SQL view is acceptable; no materialized view).

---

## 4. State Machine

No FSM — egg records are append-only facts. Edit / delete is allowed within 24 h of creation (rule R6).

---

## 5. Public API

All endpoints are scoped by authenticated `farm_id` (CONVENTIONS §4.9). All write endpoints honour `Idempotency-Key` (§4.5).

### 5.1 Zod schemas

```ts
import { z } from 'zod';

export const EggGradeSchema = z.enum(['small','medium','large','xlarge','cracked','dirty']);

export const CreateCollectionBody = z.object({
  batchId: z.string().uuid(),
  collectionDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  smallCount: z.number().int().nonnegative().default(0),
  mediumCount: z.number().int().nonnegative().default(0),
  largeCount: z.number().int().nonnegative().default(0),
  xlargeCount: z.number().int().nonnegative().default(0),
  crackedCount: z.number().int().nonnegative().default(0),
  dirtyCount: z.number().int().nonnegative().default(0),
  notes: z.string().max(500).nullable().optional(),
}).refine(
  (v) => v.smallCount + v.mediumCount + v.largeCount + v.xlargeCount + v.crackedCount + v.dirtyCount > 0,
  { message: 'At least one egg count must be > 0' },
);

export const CreateSaleBody = z.object({
  batchId: z.string().uuid(),
  saleDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  cratesSold: z.number().int().nonnegative(),
  loosesSold: z.number().int().min(0).max(29).default(0),
  pricePerCratePesewas: z.number().int().positive(),
  buyerName: z.string().max(120).nullable().optional(),
  paymentMethod: z.enum(['cash','mobile_money','bank_transfer','credit']),
  acknowledgeWithdrawal: z.boolean().optional(), // required true when withdrawal active
});

export const CreateDiscardBody = z.object({
  batchId: z.string().uuid(),
  discardDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  count: z.number().int().positive(),
  reason: z.enum(['withdrawal','spoilage','breakage','other']),
  withdrawalRecordId: z.string().uuid().nullable().optional(),
  notes: z.string().max(500).nullable().optional(),
});
```

### 5.2 Endpoints

| Method | Path | Body schema | Response |
|---|---|---|---|
| `GET` | `/batches/:batchId/egg-collections?from=&to=` | — | `{ items: EggCollection[] }` |
| `POST` | `/batches/:batchId/egg-collections` | `CreateCollectionBody` | `EggCollection` |
| `PATCH` | `/egg-collections/:id` | `CreateCollectionBody.partial()` | `EggCollection` |
| `DELETE` | `/egg-collections/:id` | — | `204` |
| `GET` | `/batches/:batchId/egg-inventory` | — | `EggInventorySnapshot` |
| `GET` | `/batches/:batchId/egg-sales?from=&to=` | — | `{ items: EggSale[] }` |
| `POST` | `/batches/:batchId/egg-sales` | `CreateSaleBody` | `EggSale` |
| `POST` | `/batches/:batchId/egg-discards` | `CreateDiscardBody` | `EggDiscard` |
| `GET` | `/batches/:batchId/egg-analytics?period=30d` | — | `EggAnalytics` |
| `GET` | `/batches/:batchId/egg-withdrawal-status` | — | `{ active: boolean, safeFrom: string \| null, medication: string \| null }` |

### 5.3 `EggAnalytics` payload

```ts
export interface EggAnalytics {
  batchId: string;
  rangeFrom: string;
  rangeTo: string;
  totalGood: number;
  totalCracked: number;
  totalDirty: number;
  avgProductionRatePct: number;
  peakProductionRatePct: number;
  weeklyTotals: { isoWeek: string; goodCount: number }[];
  dailySeries: { date: string; goodCount: number; brokenCount: number }[];
}
```

### 5.4 Inventory query

```sql
SELECT
  b.id AS batch_id,
  COALESCE(SUM(ec.good_count), 0)
    - COALESCE((SELECT SUM(crates_sold)*30 + SUM(looses_sold) FROM egg_sales WHERE batch_id = b.id), 0)
    - COALESCE((SELECT SUM(count) FROM egg_discards WHERE batch_id = b.id), 0)
  AS good_eggs_on_hand
FROM batches b
LEFT JOIN egg_collections ec ON ec.batch_id = b.id
WHERE b.id = $1 AND b.farm_id = $2
GROUP BY b.id;
```

---

## 6. Events

### 6.1 Published

```ts
export interface EggCollectionRecordedV1 {
  type: 'EGG_COLLECTION_RECORDED';
  v: 1;
  collectionId: string;
  batchId: string;
  farmId: string;
  collectionDate: string;
  goodCount: number;
  brokenCount: number; // cracked + dirty
  productionRatePct: number;
}

export interface EggSaleRecordedV1 {
  type: 'EGG_SALE_RECORDED';
  v: 1;
  saleId: string;
  batchId: string;
  farmId: string;
  saleDate: string;
  cratesSold: number;
  loosesSold: number;
  totalRevenuePesewas: number;
  buyerName: string | null;
  paymentMethod: string;
}

export interface EggInventoryLowV1 {
  type: 'EGG_INVENTORY_LOW';
  v: 1;
  batchId: string;
  farmId: string;
  cratesOnHand: number;
  threshold: number;
}

export interface EggDiscardRecordedV1 {
  type: 'EGG_DISCARD_RECORDED';
  v: 1;
  discardId: string;
  batchId: string;
  farmId: string;
  count: number;
  reason: string;
}
```

### 6.2 Consumed

| Event | From | Reaction |
|---|---|---|
| `WITHDRAWAL_STARTED` | `04_WATER_HEALTH.md` | Mark batch's egg sale UI as `withdrawalActive`; cache `safeFrom`. |
| `WITHDRAWAL_CLEARED` | `04_WATER_HEALTH.md` | Clear flag. |
| `BATCH_TERMINATED` | `02_BATCH_MANAGEMENT.md` | Soft-close egg endpoints (read-only thereafter). |

`EGG_SALE_RECORDED` is consumed by Finance (`07_FINANCE.md` §6) which writes a revenue ledger entry and patches `egg_sales.ledger_entry_id`.

---

## 7. Background Jobs

| Job | Schedule | Purpose |
|---|---|---|
| `eggInventoryLowCheck` | every 1 h, farm tz | Scan active layer batches; emit `EGG_INVENTORY_LOW` when crates < threshold (default 5, per-farm setting). |
| `eggCollectionReminder` | `0 17 * * *`, farm tz | Push notification if no collection recorded today for active layer batches with population > 0. |

pg-boss worker stub:

```ts
import PgBoss from 'pg-boss';
import { db } from '@workspace/db';
import { eggInventoryQuery, emitInventoryLow } from './service';

export async function eggInventoryLowHandler(job: PgBoss.Job<{ farmId: string }>) {
  const { farmId } = job.data;
  const rows = await eggInventoryQuery(db, farmId);
  for (const r of rows) {
    if (r.cratesOnHand < r.threshold) {
      await emitInventoryLow(r);
    }
  }
}
```

---

## 8. Business Rules & Invariants

- **R1 — Eligibility.** Egg endpoints return `404 EGG_TRACKING_NOT_APPLICABLE` unless the batch is one of:
  - `species = 'layer'`, OR
  - `species = 'duck' AND duck_type = 'layer'`.
  Broilers, turkeys, and `duck_type = 'meat'` are excluded (CONVENTIONS §2.6).
- **R2 — Layer start week.** Collections may only be recorded when the batch's `current_week >= 19` (CONVENTIONS §2.1). Earlier attempts return `409 BEFORE_LAY_START`.
- **R3 — Duck start week.** For duck layer batches, collections require `current_week >= 20` (CONVENTIONS §2.7).
- **R4 — End condition.** Tracking continues until the batch enters the `terminated` state (CONVENTIONS §2.4); there is no Week 68 cap. Once terminated, only `GET` endpoints respond; writes return `409 BATCH_TERMINATED`.
- **R5 — One record per day.** A batch may have at most one `egg_collections` row per `collection_date` (unique index `uniq_egg_collection_batch_date`). Re-submission with the same key updates via `PATCH`.
- **R6 — Edit window.** `PATCH` / `DELETE` allowed only within 24 h of `recorded_at`. Beyond that, farmer must record a discard or correction collection.
- **R7 — Production rate.** `production_rate_pct = good_count / population_at_collection × 100`. `population_at_collection` is taken from the batch's current population at the time of submission (snapshot).
- **R8 — Crate math.** 1 crate = 30 eggs (constant). Sales are recorded as `(crates, looses)`; total eggs sold = `crates*30 + looses`.
- **R9 — Sale price.** `total_revenue_pesewas = crates_sold * price_per_crate_pesewas + looses_sold * price_per_loose_pesewas`. `price_per_loose_pesewas = round(price_per_crate_pesewas / 30)`.
- **R10 — Inventory non-negative.** A sale that would drive `goodEggsOnHand < 0` returns `409 INSUFFICIENT_EGG_INVENTORY`.
- **R11 — Withdrawal guard.** When `EGG_SALE_RECORDED` is attempted while a layer-affecting withdrawal is active for the batch, the request returns `409 WITHDRAWAL_ACTIVE` unless `acknowledgeWithdrawal = true`. With acknowledgement, the sale is still **rejected** — the only allowed write during withdrawal is a discard (R12). The acknowledge flag is reserved for future override workflows.
- **R12 — Discard during withdrawal.** While withdrawal is active, the recommended flow is a discard with `reason='withdrawal'` and `withdrawal_record_id` set. The discard is the inventory deduction.
- **R13 — Auto-revenue ledger.** Every successful `POST /egg-sales` publishes `EGG_SALE_RECORDED`. Finance creates a ledger entry (`revenue_type='egg_sales'`) and patches `egg_sales.ledger_entry_id`. See `07_FINANCE.md` §6.
- **R14 — Cost privacy.** Sale endpoints respect `farm.cost_privacy_enabled`: when true, `pricePerCratePesewas` and `totalRevenuePesewas` are stripped from list/detail responses (server-side; see `07_FINANCE.md` §5.3).
- **R15 — Currency.** Pesewas integer (CONVENTIONS §4.2). Display layer formats to GHS / NGN per `farm.currency`.
- **R16 — Offline.** All write endpoints accept `Idempotency-Key`; client mirrors records in Dexie and queues in outbox.
- **R17 — Low-stock threshold.** Default 5 crates; configurable per-farm via `farm_settings.egg_low_inventory_crates`.
- **R18 — Grading totals.** A grade may be 0; submitting all zeros returns `400 EMPTY_COLLECTION`.

---

## 9. Error Codes

| Code | HTTP | Meaning |
|---|---|---|
| `EGG_TRACKING_NOT_APPLICABLE` | 404 | Batch is not layer/duck-layer. |
| `BEFORE_LAY_START` | 409 | Batch week < 19 (layer) / 20 (duck layer). |
| `BATCH_TERMINATED` | 409 | Writes after termination. |
| `DUPLICATE_COLLECTION` | 409 | Same `(batch_id, collection_date)`. |
| `EDIT_WINDOW_EXPIRED` | 409 | More than 24 h since `recorded_at`. |
| `INSUFFICIENT_EGG_INVENTORY` | 409 | Sale would overdraw inventory. |
| `WITHDRAWAL_ACTIVE` | 409 | Sale during active withdrawal. |
| `EMPTY_COLLECTION` | 400 | All grade counts are 0. |
| `INVALID_PRICE` | 400 | Non-positive price. |

---

## 10. Observability

Log fields per request: `farm_id`, `batch_id`, `route`, `egg_collection_id` / `egg_sale_id` when applicable, `production_rate_pct`. Metrics:

- `egg_collection_recorded_total{species,duck_type}`
- `egg_sale_total_revenue_pesewas{farm_id}` (counter)
- `egg_inventory_low_alerts_total`

---

## 11. Test Plan

Vitest + supertest. Cover at minimum:

- R1: broiler batch returns 404 on `POST /egg-collections`.
- R2 / R3: week 18 layer rejected; week 19 accepted; week 19 duck-layer rejected; week 20 duck-layer accepted.
- R4: terminated batch read-only.
- R5: duplicate (batch, date) → 409.
- R6: edit beyond 24 h → 409.
- R7: production rate math edge cases (population 0 → 400).
- R8 / R9: crate + loose math, rounding of `pricePerLoosePesewas`.
- R10: oversold → 409.
- R11: sale with active withdrawal → 409.
- R13: sale emits `EGG_SALE_RECORDED`; Finance handler creates ledger entry; back-patch verified.
- R14: cost privacy strips fields.

---

## 12. Open Questions

- Should we support multi-collection per day (morning + evening) by allowing a `collection_slot` discriminator? Currently single record per day.
- Egg pricing history — do we store last sale price for autofill suggestion? Out of scope for v1.

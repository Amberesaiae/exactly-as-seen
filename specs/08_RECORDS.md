# Records & Analytics

**Status:** Spec v2 (rewritten 2026-05-03)
**Module path:** `artifacts/api-server/src/modules/records`
**Owner:** TBD

> Conventions: see `00_CONVENTIONS.md`. Read-only module — all data sourced from other modules via aggregate queries.

---

## 1. Purpose & Scope

Read-only analytics layer over Batch (`02_BATCH_MANAGEMENT.md`), Water-Health (`04_WATER_HEALTH.md`), Finance (`07_FINANCE.md`), Egg Production (`05_EGG_PRODUCTION.md`), and Feed Calculator (`03_FEED_CALCULATOR.md`).

**In scope:**

- Batch list with derived KPIs.
- Per-batch detail (overview, weekly progression, activity timeline).
- Side-by-side comparison of 2–4 batches.
- Server-rendered PDF export and CSV export.
- Aggregate SQL queries with CTEs.

**Out of scope:**

- Materialised views (not used in v1; revisit if any aggregate query exceeds 500 ms p95 — see §12).
- Forecasting / ML (beyond simple sales-estimate formulas already in `07_FINANCE.md` §4).
- Cross-farm benchmarks.

---

## 2. Domain Model

`Records` does not own tables; it owns query result types.

```ts
export type BatchStatus = 'active' | 'terminated' | 'sold' | 'culled';

export interface BatchRecordSummary {
  batchId: string;
  farmId: string;
  species: 'broiler' | 'layer' | 'duck' | 'turkey' | 'other';
  duckType: 'meat' | 'layer' | null;
  productionSystem: 'intensive' | 'semi_intensive';
  houseId: string;
  startedOn: string;
  endedOn: string | null;
  status: BatchStatus;
  initialPopulation: number;
  currentOrFinalPopulation: number;
  mortalityCount: number;
  mortalityRatePct: number;
  durationWeeks: number;
  currentWeek: number | null;          // null when terminated
  totalExpensesPesewas: number | null; // null when masked
  totalRevenuePesewas: number | null;
  netProfitPesewas: number | null;
  roiPct: number | null;
  fcr: number | null;                  // null if no weight data
  feedConsumedKg: number;
  healthTasksCompleted: number;
  healthTasksTotal: number;
  vaccinationsCompleted: number;
  vaccinationsTotal: number;
  eggTotal: number | null;             // null for non-laying
  eggProductionRatePct: number | null;
}

export interface BatchWeeklyRow {
  weekNumber: number;
  populationStart: number;
  populationEnd: number;
  mortalityCount: number;
  feedConsumedKg: number;
  healthTasksDone: number;
  healthTasksScheduled: number;
  eggsCollected: number | null;
  expensesPesewas: number | null;
  revenuePesewas: number | null;
}

export interface ActivityEvent {
  occurredAt: string;
  kind:
    | 'batch_created' | 'phase_advanced' | 'mortality_recorded'
    | 'health_task_completed' | 'vaccination_completed'
    | 'feed_formulation_used' | 'egg_collection' | 'egg_sale'
    | 'expense' | 'revenue' | 'batch_terminated';
  description: string;
  refId: string;
  amountPesewas: number | null;
  qty: number | null;
}

export interface ComparisonResult {
  batches: BatchRecordSummary[];
  metrics: {
    metric: keyof BatchRecordSummary;
    label: string;
    direction: 'higher_better' | 'lower_better';
    bestBatchId: string | null;
    values: { batchId: string; value: number | null }[];
  }[];
  insights: { code: string; severity: 'info' | 'success' | 'warn'; message: string }[];
}
```

---

## 3. Drizzle Schema

No tables in this module. All queries are CTE-driven over existing tables. A single optional table tracks user-initiated exports for audit:

```ts
import { pgTable, text, timestamp, integer } from 'drizzle-orm/pg-core';

export const recordExports = pgTable('record_exports', {
  id: text('id').primaryKey(),
  farmId: text('farm_id').notNull(),
  userId: text('user_id').notNull(),
  kind: text('kind').notNull(),          // 'batch_pdf' | 'batch_csv' | 'comparison_pdf'
  batchIds: text('batch_ids').notNull(), // JSON array
  maskedFinancials: integer('masked_financials').notNull(), // 0 or 1
  bytes: integer('bytes').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});
```

---

## 4. State Machine

None — read-only.

---

## 5. Public API

The frontend uses 4 tabs (`Overview`, `Batches`, `Health`, `Finance`). Endpoints map onto those tabs.

### 5.1 Zod schemas

```ts
import { z } from 'zod';

export const ListBatchRecordsQuery = z.object({
  status: z.enum(['active','terminated','sold','culled','all']).default('all'),
  species: z.enum(['broiler','layer','duck','turkey','other']).optional(),
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  cursor: z.string().optional(),
  limit: z.number().int().min(1).max(100).default(25),
});

export const CompareBody = z.object({
  batchIds: z.array(z.string().uuid()).min(2).max(4),
});

export const ExportQuery = z.object({
  format: z.enum(['pdf','csv']).default('pdf'),
  includeFinancials: z.boolean().optional(), // honoured only if no privacy mask
});
```

### 5.2 Endpoints (4 tabs)

| Tab | Method | Path | Body / Query | Response |
|---|---|---|---|---|
| Overview | `GET` | `/records/overview?period=month\|quarter\|year\|all` | — | `OverviewKpis` |
| Overview | `GET` | `/records/trends?metric=&period=` | — | `{ series: { date, value }[] }` |
| Batches | `GET` | `/records/batches` | `ListBatchRecordsQuery` | `{ items: BatchRecordSummary[], nextCursor }` |
| Batches | `GET` | `/records/batches/:batchId` | — | `{ summary: BatchRecordSummary, weekly: BatchWeeklyRow[] }` |
| Batches | `GET` | `/records/batches/:batchId/activity?cursor=&limit=` | — | `{ items: ActivityEvent[], nextCursor }` |
| Batches | `POST` | `/records/compare` | `CompareBody` | `ComparisonResult` |
| Batches | `GET` | `/records/batches/:batchId/export` | `ExportQuery` | binary (`application/pdf` or `text/csv`) |
| Batches | `POST` | `/records/compare/export` | `CompareBody & ExportQuery` | binary |
| Health | `GET` | `/records/health/summary?batchId=&from=&to=` | — | `HealthSummary` |
| Health | `GET` | `/records/health/withdrawal-history?batchId=` | — | `{ items: WithdrawalHistoryRow[] }` |
| Finance | `GET` | `/records/finance/summary?from=&to=&batchId=` | — | proxies `07_FINANCE.md` `/finance/pnl/...` with the same masking rules |
| Finance | `GET` | `/records/finance/category-breakdown?from=&to=` | — | `{ byCategory: Record<ExpenseCategory, number>, byRevenueType: Record<RevenueType, number> }` |

```ts
export interface OverviewKpis {
  activeBatches: number;
  totalBatches: number;
  birdsOnFarm: number;
  avgMortalityRatePct: number;
  feedConsumedKg: number;
  totalExpensesPesewas: number | null;
  totalRevenuePesewas: number | null;
  netProfitPesewas: number | null;
}

export interface HealthSummary {
  tasksCompleted: number;
  tasksTotal: number;
  vaccinationsCompleted: number;
  vaccinationsTotal: number;
  withdrawalsActive: number;
  conflictsBlocked: number;
}

export interface WithdrawalHistoryRow {
  withdrawalId: string;
  medication: string;
  startedOn: string;
  safeFromMeat: string | null;
  safeFromEggs: string | null;
  status: 'active' | 'cleared';
}
```

### 5.3 Aggregate query — `BatchRecordSummary`

Drizzle SQL with CTEs (no materialised view):

```sql
WITH base AS (
  SELECT b.id AS batch_id, b.farm_id, b.species, b.duck_type, b.production_system,
         b.house_id, b.started_on, b.ended_on, b.status,
         b.initial_population, b.population AS current_population,
         b.current_week,
         COALESCE(EXTRACT(EPOCH FROM (COALESCE(b.ended_on, NOW()) - b.started_on)) / (7*86400), 0)::int AS duration_weeks
  FROM batches b
  WHERE b.farm_id = $1 AND b.id = ANY($2::text[])
),
mortality AS (
  SELECT batch_id, COALESCE(SUM(count), 0) AS mortality_count
  FROM mortality_records WHERE farm_id = $1 AND batch_id = ANY($2::text[])
  GROUP BY batch_id
),
feed AS (
  SELECT batch_id,
         COALESCE(SUM(total_amount_kg), 0) AS feed_kg
  FROM feed_schedules WHERE farm_id = $1 AND batch_id = ANY($2::text[])
  GROUP BY batch_id
),
health AS (
  SELECT batch_id,
         COUNT(*) FILTER (WHERE status='completed')                                AS done,
         COUNT(*)                                                                  AS total,
         COUNT(*) FILTER (WHERE status='completed' AND task_kind='vaccination')    AS vacc_done,
         COUNT(*) FILTER (WHERE task_kind='vaccination')                           AS vacc_total
  FROM health_tasks WHERE farm_id = $1 AND batch_id = ANY($2::text[])
  GROUP BY batch_id
),
expenses AS (
  SELECT batch_id, COALESCE(SUM(amount_pesewas), 0) AS total_expenses
  FROM expense_entries WHERE farm_id = $1 AND batch_id = ANY($2::text[])
  GROUP BY batch_id
),
revenue AS (
  SELECT batch_id, COALESCE(SUM(amount_pesewas), 0) AS total_revenue
  FROM revenue_entries WHERE farm_id = $1 AND batch_id = ANY($2::text[])
  GROUP BY batch_id
),
eggs AS (
  SELECT batch_id,
         COALESCE(SUM(good_count), 0) AS egg_total,
         CASE WHEN SUM(population_at_collection) > 0
              THEN ROUND(100.0 * SUM(good_count)::numeric / SUM(population_at_collection), 2)
              ELSE NULL END AS egg_rate_pct
  FROM egg_collections WHERE farm_id = $1 AND batch_id = ANY($2::text[])
  GROUP BY batch_id
)
SELECT
  base.*,
  COALESCE(mortality.mortality_count, 0) AS mortality_count,
  CASE WHEN base.initial_population > 0
       THEN ROUND(100.0 * COALESCE(mortality.mortality_count,0) / base.initial_population, 2)
       ELSE 0 END AS mortality_rate_pct,
  COALESCE(feed.feed_kg, 0) AS feed_kg,
  COALESCE(health.done, 0)        AS health_done,
  COALESCE(health.total, 0)       AS health_total,
  COALESCE(health.vacc_done, 0)   AS vacc_done,
  COALESCE(health.vacc_total, 0)  AS vacc_total,
  COALESCE(expenses.total_expenses, 0) AS total_expenses,
  COALESCE(revenue.total_revenue, 0)   AS total_revenue,
  eggs.egg_total,
  eggs.egg_rate_pct
FROM base
LEFT JOIN mortality USING (batch_id)
LEFT JOIN feed      USING (batch_id)
LEFT JOIN health    USING (batch_id)
LEFT JOIN expenses  USING (batch_id)
LEFT JOIN revenue   USING (batch_id)
LEFT JOIN eggs      USING (batch_id);
```

FCR is post-processed in TypeScript: `fcr = feed_kg / total_weight_gain_kg` where `total_weight_gain_kg` comes from `02_BATCH_MANAGEMENT.md` weight tracking; null if no weights.

### 5.4 Activity timeline query

`UNION ALL` over the relevant tables, ordered by `occurred_at DESC`:

```sql
SELECT 'mortality_recorded' AS kind, recorded_at AS occurred_at, count AS qty,
       NULL::int AS amount_pesewas, id::text AS ref_id,
       'Mortality: ' || count || ' birds' AS description
  FROM mortality_records WHERE batch_id = $1 AND farm_id = $2
UNION ALL
SELECT 'health_task_completed', completed_at, NULL, NULL, id::text,
       'Health: ' || medication FROM health_tasks
  WHERE batch_id = $1 AND farm_id = $2 AND status = 'completed'
UNION ALL
SELECT 'expense', recorded_at, NULL, amount_pesewas, id::text,
       category || ': ' || description FROM expense_entries
  WHERE batch_id = $1 AND farm_id = $2
UNION ALL
SELECT 'revenue', recorded_at, qty, amount_pesewas, id::text,
       type || ': ' || description FROM revenue_entries
  WHERE batch_id = $1 AND farm_id = $2
UNION ALL
SELECT 'egg_collection', recorded_at, good_count, NULL, id::text,
       'Eggs collected: ' || good_count FROM egg_collections
  WHERE batch_id = $1 AND farm_id = $2
ORDER BY occurred_at DESC
LIMIT $3 OFFSET $4;
```

### 5.5 PDF export (server-rendered)

PDF is generated server-side using **`@react-pdf/renderer`** in a streaming response. Templates live in `modules/records/pdf/`.

```ts
import { Router } from 'express';
import { renderToStream } from '@react-pdf/renderer';
import { BatchReport } from './pdf/batch-report.js';

router.get('/records/batches/:batchId/export', async (req, res) => {
  const data = await loadBatchExport(req.farm.id, req.params.batchId, req.locals.financialMaskActive);
  if (req.query.format === 'csv') {
    res.type('text/csv');
    return streamCsv(res, data);
  }
  res.type('application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="batch-${req.params.batchId}.pdf"`);
  const stream = await renderToStream(BatchReport({ data }));
  stream.pipe(res);
  await recordExport(req, 'batch_pdf', [req.params.batchId]);
});
```

The PDF template renders in three sections: header (farm/batch identification), KPIs, weekly table. Charts use server-side SVG via `@react-pdf/renderer`'s `<Svg>` primitive (no headless browser).

---

## 6. Events

Records publishes nothing. It consumes nothing operationally — instead it queries on demand. (No outbox subscription.)

For PDF/CSV export auditing, an internal-only `RECORDS_EXPORT_GENERATED` event may be emitted for analytics later; not required in v1.

---

## 7. Background Jobs

| Job | Schedule | Purpose |
|---|---|---|
| `records-cache-warm` | `0 5 * * *` farm tz | Optional: pre-compute `OverviewKpis` per farm into `dashboard_cache` (Dexie) with 6 h TTL. Optional, not required in v1. |

No other scheduled work — Records is on-demand.

---

## 8. Business Rules & Invariants

- **R1 — Read-only.** Records emits no domain events and writes nothing except `record_exports` audit rows.
- **R2 — Authorization.** Every query filters by authenticated `farm_id` (CONVENTIONS §4.9). `:batchId` paths verify ownership.
- **R3 — Cost privacy passthrough.** When `farm.cost_privacy_enabled = true` and no active unmask grant (see `07_FINANCE.md` §5.3), all monetary fields in responses are returned as `null` and the response includes `"financialsMasked": true`. Exports honour the same flag — financial columns/sections are omitted from PDFs/CSVs.
- **R4 — 4 tabs.** UI is structured as `Overview`, `Batches` (list + detail + compare), `Health`, `Finance`. Endpoints in §5.2 are grouped to match.
- **R5 — Comparison cardinality.** `POST /records/compare` accepts 2–4 batch ids. <2 → `400`, >4 → `400`.
- **R6 — Best-performer flagging.** Per metric direction:
  - `lower_better`: mortality rate, FCR.
  - `higher_better`: health task completion rate, vaccination rate, egg rate, ROI, net profit.
  Tie → `bestBatchId = null`.
- **R7 — Comparison insights.** At least 2 insight rows are emitted when at least 2 batches with non-null compared metrics exist. Rules:
  - Mortality difference > 2 percentage points → `INSIGHT_MORTALITY_GAP` (warn).
  - FCR improvement > 0.1 between earliest and latest by `startedOn` → `INSIGHT_FCR_IMPROVEMENT` (success).
  - Vaccination compliance < 100% on any batch → `INSIGHT_VACCINATION_GAP` (warn).
  - When privacy is active, financial-based insights are suppressed.
- **R8 — Aggregate queries via CTE.** All multi-table aggregations use `WITH` CTEs (§5.3, §5.4). Materialised views are **not** used in v1; if any query exceeds 500 ms p95, see §12.
- **R9 — Pagination.** Cursor-based, opaque base64 over `(occurred_at, id)`. `limit` ≤ 100.
- **R10 — Date handling.** All `from`/`to` filters are inclusive and use `farm.timezone` to bucket day boundaries (CONVENTIONS §4.4).
- **R11 — Export formats.** PDF and CSV. PDF is server-rendered via `@react-pdf/renderer` (no headless browser). CSV is plain RFC-4180.
- **R12 — Export audit.** Every export writes a `record_exports` row capturing `farmId`, `userId`, `kind`, `batchIds`, `maskedFinancials`, `bytes`. Used by Finance team to detect privacy-bypass patterns.
- **R13 — Activity ordering.** Timeline ordered by `occurred_at DESC`, ties broken by event kind alphabetical.
- **R14 — Comparison currency.** All compared batches must share the same `farm.currency`. Cross-farm compare is impossible because of R2.
- **R15 — Termination required for "final" metrics.** `currentOrFinalPopulation`, `endedOn`, `durationWeeks` are computed from current state for active batches and from `ended_on` for terminated ones. ROI/net profit are emitted for both, but flagged `inProgress: true` on active batches.
- **R16 — No double-counting.** Per-batch financial aggregates exclude `expense_entries` / `revenue_entries` rows where `batch_id IS NULL` (farm-wide). Farm-wide totals include both.

---

## 9. Error Codes

| Code | HTTP | Meaning |
|---|---|---|
| `BATCH_NOT_FOUND` | 404 | |
| `COMPARE_TOO_FEW` | 400 | < 2 batch ids |
| `COMPARE_TOO_MANY` | 400 | > 4 batch ids |
| `EXPORT_FORMAT_INVALID` | 400 | |
| `INSUFFICIENT_DATA` | 409 | Activity / weekly query for batch with no events. Returns 200 with empty arrays normally; only used when summary is impossible. |

---

## 10. Observability

Metrics:

- `records_query_duration_ms{endpoint}` (histogram)
- `records_export_total{kind,masked}` (counter)
- `records_export_bytes_sum` (counter)

Log fields per request: `farm_id`, `endpoint`, `batch_id_count`, `masked`, `cache_hit` (when warm cache used).

A latency budget of **500 ms p95** per endpoint is enforced via SLO; breaches trigger investigation per §12.

---

## 11. Test Plan

- R2: cross-farm batch id → 404.
- R3: privacy on → financial fields null in `BatchRecordSummary`, `OverviewKpis`, P&L proxy responses; PDF/CSV omit financial columns.
- R5: 1 id → 400; 5 ids → 400.
- R6: best-performer correct for each metric direction; ties → null.
- R7: insight rules emit expected codes; financial insights suppressed under privacy.
- R8: confirm CTE-based query plan via `EXPLAIN ANALYZE` fixture; assert no `Materialize` node ≥ rule.
- R11: PDF export returns `application/pdf`, magic bytes `%PDF`. CSV returns header row + N rows.
- R12: every export writes one `record_exports` row.
- R15: active batch summary returns `inProgress: true`.
- R16: per-batch totals exclude null-batch entries; farm totals include them.

---

## 12. Open Questions

- **Materialised view trigger.** Currently not used. If `BatchRecordSummary` aggregate exceeds 500 ms p95 over a farm with > 50 batches, introduce a `MATERIALIZED VIEW batch_record_summary_mv` refreshed nightly via the `records-cache-warm` job slot. Documented now to keep migration path obvious.
- Activity timeline filtering (by kind) — needed in v1 or v1.1?
- Should compare endpoint accept date-bounded windows per batch (e.g. compare first 4 weeks of each)? Currently full-batch only.
- CSV per-table or single combined? Currently single combined per export.

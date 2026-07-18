# Batch Management System

**Status:** Spec v2 (rewritten 2026-05-03)
**Module path:** `artifacts/api-server/src/modules/batch`
**Owner:** TBD

> Source: `attached_assets/Batch_Management_System_—_LampFarms_1777797779755.md`. Conventions in `00_CONVENTIONS.md` supersede the original.

---

## 1. Purpose & Scope

Batch Management is the core domain of LampFarms. Every other module (Feed, Water-Health, Egg Production, Stock, Finance) operates within the context of a **batch** — a cohort of birds reared together with one start date, one species, one production system, and one lifecycle.

In scope:

- 3-step Batch Creation Wizard (with **Step 1b** for duck sub-type selection).
- Batch dashboard, batch detail page (Overview / Feed / Health / Performance / Expenses tabs).
- Mortality recording.
- Manual and scheduled week advancement (with optimistic concurrency lock).
- Batch termination (normal + emergency).
- 8-state FSM modelled in **XState v5**.
- Cross-module event publication (`BATCH_CREATED`, `BATCH_WEEK_ADVANCED`, `BATCH_PHASE_CHANGED`, `BATCH_TERMINATED`, `MORTALITY_RECORDED`).

Out of scope: medication generation (see `03_WATER_HEALTH.md`), feed formulation (see `04_FEED_CALCULATOR.md`), egg-output capture (see `05_EGG_PRODUCTION.md`).

---

## 2. Domain Model

### 2.1 Entities

```ts
// Species & duck sub-type
export type Species = 'broiler' | 'layer' | 'duck' | 'turkey' | 'other';
export type DuckType = 'meat' | 'layer';                  // CONVENTIONS §2.6
export type ProductionSystem = 'intensive' | 'semi_intensive';

// FSM state — exactly 8 (CONVENTIONS §1, see also XState machine in §4)
export type BatchPhase =
  | 'created'
  | 'brooding'
  | 'starter'
  | 'grower'
  | 'finisher'
  | 'withdrawal'
  | 'ready_to_sell'
  | 'terminated';

export interface Batch {
  id: string;                       // UUIDv7
  farm_id: string;
  house_id: string;
  name: string;
  species: Species;
  duck_type: DuckType | null;       // required iff species === 'duck'
  production_system: ProductionSystem;
  breed: string | null;
  start_date: string;               // ISO date in farm timezone
  initial_quantity: number;
  current_quantity: number;
  current_week: number;             // 0 on creation; incremented weekly
  phase: BatchPhase;
  cycle_length_weeks: number;       // species/duck_type specific (see §2.4)
  has_active_withdrawal: boolean;   // cached; recomputed on health task events
  terminated_at: string | null;
  termination_reason: 'normal' | 'emergency' | null;
  created_at: string;
  updated_at: string;
}

export interface MortalityEvent {
  id: string;
  batch_id: string;
  recorded_at: string;
  count: number;
  cause: 'unknown' | 'disease' | 'predator' | 'injury' | 'culling' | 'other';
  notes: string | null;
}
```

### 2.2 House

```ts
export interface House {
  id: string;
  farm_id: string;
  name: string;
  capacity: number;
  occupied_by_batch_id: string | null;
}
```

A house holds **one active batch at a time**. The wizard disables houses where `occupied_by_batch_id` is non-null.

### 2.3 Lifecycle thresholds (CONVENTIONS §2.4–2.7, §2.8)

| Species (+ sub-type) | `cycle_length_weeks` (default) | Configurable range | Phase boundaries (week ranges) |
|---|---|---|---|
| `broiler` | 8 | 6–8 | brooding 1, starter 1–3, grower 4–5, finisher 6–8 |
| `layer` | 78 | 72–78 | brooding 1–4, starter (rearing) 5–8, grower 9–18, **finisher = production** 19+ |
| `duck` (`meat`) | 10 | 8–10 | brooding 1, starter 2–3, grower 4–6, finisher 7–10 |
| `duck` (`layer`) | 78 | 72+ | brooding 1–4, starter 5–8, grower 9–19, finisher (laying) **20+** |
| `turkey` | 16 | 12–20 | brooding 1–4, starter 5–8, grower 9–12, finisher 13–N |

`withdrawal` is entered transiently on demand (see §4.3); `ready_to_sell` follows once all withdrawal periods clear.

---

## 3. Drizzle Schema

```ts
// artifacts/api-server/src/db/schema/batch.ts
import {
  pgTable, text, integer, boolean, timestamp, date, index, uniqueIndex,
} from 'drizzle-orm/pg-core';

export const houses = pgTable('houses', {
  id: text('id').primaryKey(),
  farm_id: text('farm_id').notNull(),
  name: text('name').notNull(),
  capacity: integer('capacity').notNull(),
  occupied_by_batch_id: text('occupied_by_batch_id'),
  created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updated_at: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  farm_idx: index('houses_farm_idx').on(t.farm_id),
  farm_name_uniq: uniqueIndex('houses_farm_name_uniq').on(t.farm_id, t.name),
}));

export const batches = pgTable('batches', {
  id: text('id').primaryKey(),
  farm_id: text('farm_id').notNull(),
  house_id: text('house_id').notNull().references(() => houses.id),
  name: text('name').notNull(),
  species: text('species', { enum: ['broiler','layer','duck','turkey','other'] }).notNull(),
  duck_type: text('duck_type', { enum: ['meat','layer'] }),
  production_system: text('production_system', { enum: ['intensive','semi_intensive'] }).notNull(),
  breed: text('breed'),
  start_date: date('start_date').notNull(),
  initial_quantity: integer('initial_quantity').notNull(),
  current_quantity: integer('current_quantity').notNull(),
  current_week: integer('current_week').notNull().default(0),
  phase: text('phase', {
    enum: ['created','brooding','starter','grower','finisher','withdrawal','ready_to_sell','terminated'],
  }).notNull().default('created'),
  cycle_length_weeks: integer('cycle_length_weeks').notNull(),
  has_active_withdrawal: boolean('has_active_withdrawal').notNull().default(false),
  terminated_at: timestamp('terminated_at', { withTimezone: true }),
  termination_reason: text('termination_reason', { enum: ['normal','emergency'] }),
  created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updated_at: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  farm_idx: index('batches_farm_idx').on(t.farm_id),
  house_idx: index('batches_house_idx').on(t.house_id),
  farm_phase_idx: index('batches_farm_phase_idx').on(t.farm_id, t.phase),
}));

export const mortality_events = pgTable('mortality_events', {
  id: text('id').primaryKey(),
  batch_id: text('batch_id').notNull().references(() => batches.id),
  recorded_at: timestamp('recorded_at', { withTimezone: true }).notNull().defaultNow(),
  count: integer('count').notNull(),
  cause: text('cause', { enum: ['unknown','disease','predator','injury','culling','other'] })
    .notNull().default('unknown'),
  notes: text('notes'),
}, (t) => ({
  batch_idx: index('mortality_batch_idx').on(t.batch_id),
}));
```

**Constraints (DB / app-level):**

1. `species = 'duck'` ⇔ `duck_type IS NOT NULL` (CHECK).
2. `species ∈ ('broiler','layer')` ⇒ `production_system = 'intensive'` (CHECK).
3. `current_quantity <= initial_quantity` (CHECK).
4. `initial_quantity <= houses.capacity` (app-level on insert).
5. Only one row per house with `phase != 'terminated'` (partial unique index `WHERE phase <> 'terminated'`).

---

## 4. State Machine — XState v5

### 4.1 Full machine

```ts
// artifacts/api-server/src/modules/batch/fsm/batch-machine.ts
import { setup, assign } from 'xstate';

export interface BatchContext {
  batchId: string;
  species: 'broiler' | 'layer' | 'duck' | 'turkey' | 'other';
  duckType: 'meat' | 'layer' | null;
  productionSystem: 'intensive' | 'semi_intensive';
  currentWeek: number;
  cycleLengthWeeks: number;
  hasActiveWithdrawal: boolean;
}

export type BatchEvent =
  | { type: 'START_BATCH' }
  | { type: 'ADVANCE_WEEK'; expectedCurrentWeek: number }   // optimistic lock (§2.14)
  | { type: 'ENTER_WITHDRAWAL' }
  | { type: 'CLEAR_WITHDRAWAL' }
  | { type: 'TERMINATE_NORMAL' }
  | { type: 'EMERGENCY_TERMINATE'; reason: string };

// Phase boundary table (CONVENTIONS §2.4–2.8)
const PHASE_BOUNDARIES: Record<string, { brooding: number; starter: number; grower: number; finisher: number }> = {
  broiler:        { brooding: 1, starter: 3, grower: 5, finisher: 8  },
  layer:          { brooding: 4, starter: 8, grower: 18, finisher: 78 },
  duck_meat:      { brooding: 1, starter: 3, grower: 6, finisher: 10 },
  duck_layer:     { brooding: 4, starter: 8, grower: 19, finisher: 78 },
  turkey:         { brooding: 4, starter: 8, grower: 12, finisher: 16 },
  other:          { brooding: 2, starter: 6, grower: 12, finisher: 24 },
};

function boundaryKey(ctx: BatchContext): keyof typeof PHASE_BOUNDARIES {
  if (ctx.species === 'duck') return ctx.duckType === 'layer' ? 'duck_layer' : 'duck_meat';
  return ctx.species;
}

export const batchMachine = setup({
  types: { context: {} as BatchContext, events: {} as BatchEvent },
  guards: {
    weekIs: ({ context, event }) =>
      event.type === 'ADVANCE_WEEK' && event.expectedCurrentWeek === context.currentWeek,
    pastBrooding: ({ context }) => context.currentWeek > PHASE_BOUNDARIES[boundaryKey(context)].brooding,
    pastStarter:  ({ context }) => context.currentWeek > PHASE_BOUNDARIES[boundaryKey(context)].starter,
    pastGrower:   ({ context }) => context.currentWeek > PHASE_BOUNDARIES[boundaryKey(context)].grower,
    pastFinisher: ({ context }) => context.currentWeek >= PHASE_BOUNDARIES[boundaryKey(context)].finisher,
    noActiveWithdrawal: ({ context }) => !context.hasActiveWithdrawal,
  },
  actions: {
    incrementWeek: assign({ currentWeek: ({ context }) => context.currentWeek + 1 }),
  },
}).createMachine({
  id: 'batch',
  initial: 'created',
  states: {
    created: {
      on: { START_BATCH: 'brooding' },
    },
    brooding: {
      on: {
        ADVANCE_WEEK: [
          { guard: 'weekIs', actions: 'incrementWeek', target: 'starter', reenter: false }, // resolved by always
        ],
        ENTER_WITHDRAWAL: 'withdrawal',
        EMERGENCY_TERMINATE: 'terminated',
      },
      always: [{ guard: 'pastBrooding', target: 'starter' }],
    },
    starter: {
      on: {
        ADVANCE_WEEK: { guard: 'weekIs', actions: 'incrementWeek' },
        ENTER_WITHDRAWAL: 'withdrawal',
        EMERGENCY_TERMINATE: 'terminated',
      },
      always: [{ guard: 'pastStarter', target: 'grower' }],
    },
    grower: {
      on: {
        ADVANCE_WEEK: { guard: 'weekIs', actions: 'incrementWeek' },
        ENTER_WITHDRAWAL: 'withdrawal',
        EMERGENCY_TERMINATE: 'terminated',
      },
      always: [{ guard: 'pastGrower', target: 'finisher' }],
    },
    finisher: {
      on: {
        ADVANCE_WEEK: { guard: 'weekIs', actions: 'incrementWeek' },
        ENTER_WITHDRAWAL: 'withdrawal',
        TERMINATE_NORMAL: { guard: 'noActiveWithdrawal', target: 'ready_to_sell' },
        EMERGENCY_TERMINATE: 'terminated',
      },
    },
    withdrawal: {
      // TERMINATE_NORMAL intentionally not defined here — blocked while withdrawing.
      on: {
        CLEAR_WITHDRAWAL: 'ready_to_sell',
        EMERGENCY_TERMINATE: 'terminated',
      },
    },
    ready_to_sell: {
      on: {
        TERMINATE_NORMAL: 'terminated',
        EMERGENCY_TERMINATE: 'terminated',
      },
    },
    terminated: { type: 'final' },
  },
});
```

### 4.2 FSM ↔ DB synchronisation

The XState machine is the **decision engine**, not the system of record. The `BatchLifecycleService`:

1. Loads `Batch` from DB.
2. Hydrates `BatchContext` from the row.
3. Sends an event to a freshly-created actor (`createActor(batchMachine, { snapshot, input })`).
4. Persists the resulting `phase` and `current_week` via the optimistic UPDATE in §6.

### 4.3 Withdrawal entry/exit

`ENTER_WITHDRAWAL` is emitted by the Water-Health module whenever a `health_task` with `withdrawal_days > 0` is completed. `CLEAR_WITHDRAWAL` is emitted when the `checkWithdrawalPeriods` job (CONVENTIONS §2.11) finds zero active withdrawals.

---

## 5. Public API

All endpoints are mounted under `/api/v1/batches` in `artifacts/api-server/src/modules/batch/routes.ts`. All write endpoints accept `Idempotency-Key` (CONVENTIONS §4.5).

### 5.1 `POST /batches` — create batch

```ts
// Request
export const CreateBatchInput = z.object({
  id: z.string().uuid(),                                // client-generated UUIDv7
  house_id: z.string().uuid(),
  name: z.string().min(1).max(100),
  species: z.enum(['broiler','layer','duck','turkey','other']),
  duck_type: z.enum(['meat','layer']).nullable().optional(),
  production_system: z.enum(['intensive','semi_intensive']),
  breed: z.string().max(80).nullable().optional(),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  initial_quantity: z.number().int().positive(),
  cycle_length_weeks: z.number().int().min(6).max(120).optional(),
}).superRefine((v, ctx) => {
  if (v.species === 'duck' && !v.duck_type) {
    ctx.addIssue({ code: 'custom', path: ['duck_type'], message: 'duck_type required for ducks' });
  }
  if ((v.species === 'broiler' || v.species === 'layer') && v.production_system !== 'intensive') {
    ctx.addIssue({ code: 'custom', path: ['production_system'], message: 'broiler/layer must be intensive' });
  }
});

// Response (201)
export const BatchResponse = z.object({
  batch: BatchSchema,                                  // full batch row
  generated_health_task_count: z.number().int(),
});
```

**Errors:** `HOUSE_OCCUPIED` (409), `QUANTITY_EXCEEDS_CAPACITY` (422), `DUCK_TYPE_REQUIRED` (422).

### 5.2 `GET /batches` — list

```ts
export const ListBatchesQuery = z.object({
  species: z.enum(['broiler','layer','duck','turkey','other']).optional(),
  status:  z.enum(['active','completed','terminated']).optional(),
  house_id: z.string().uuid().optional(),
  cursor: z.string().optional(),
  limit: z.number().int().min(1).max(100).default(50),
});
export const ListBatchesResponse = z.object({
  items: z.array(BatchSchema),
  next_cursor: z.string().nullable(),
});
```

### 5.3 `GET /batches/:id` — detail

Returns the batch row plus eager-loaded summary counters used by the 5-tab UI:

```ts
export const BatchDetailResponse = z.object({
  batch: BatchSchema,
  pending_health_task_count: z.number().int(),
  active_withdrawal_count: z.number().int(),
  total_mortality: z.number().int(),
  current_phase_label: z.string(),                     // e.g. "Finisher Phase"
  next_phase_starts_week: z.number().int().nullable(),
});
```

### 5.4 `POST /batches/:id/advance-week` — manual advance (with optimistic lock §2.14)

```ts
export const AdvanceWeekInput = z.object({
  expected_current_week: z.number().int().min(0),
});
export const AdvanceWeekResponse = z.object({
  batch: BatchSchema,
  phase_changed: z.boolean(),
  previous_phase: z.string(),
});
```

**Implementation (Drizzle):**

```ts
const updated = await db.update(batches)
  .set({ current_week: input.expected_current_week + 1, updated_at: new Date() })
  .where(and(
    eq(batches.id, batchId),
    eq(batches.farm_id, farmId),
    eq(batches.current_week, input.expected_current_week),
  ))
  .returning();

if (updated.length === 0) {
  throw new HttpError(409, 'WEEK_ADVANCE_RACED', 'current_week changed; refresh and retry');
}
```

The phase recompute then runs the FSM as in §4.2 and persists the new `phase` if changed.

### 5.5 `POST /batches/:id/mortality` — record mortality

```ts
export const RecordMortalityInput = z.object({
  count: z.number().int().positive(),
  cause: z.enum(['unknown','disease','predator','injury','culling','other']).default('unknown'),
  notes: z.string().max(500).nullable().optional(),
});
export const RecordMortalityResponse = z.object({
  mortality_event: MortalityEventSchema,
  new_current_quantity: z.number().int(),
});
```

Decrements `batches.current_quantity` atomically; rejects if `count > current_quantity`.

### 5.6 `POST /batches/:id/terminate` — terminate

```ts
export const TerminateInput = z.object({
  mode: z.enum(['normal','emergency']),
  reason: z.string().max(500).optional(),
});
export const TerminateResponse = z.object({ batch: BatchSchema });
```

`mode = 'normal'` is rejected with `WITHDRAWAL_ACTIVE` (409) when `has_active_withdrawal = true`. `mode = 'emergency'` always succeeds.

---

## 6. Events Published / Consumed

All events are written to the `outbox` table in the same DB transaction as the business write, then relayed by **pg-boss** (CONVENTIONS §1).

| Event | Payload type | When |
|---|---|---|
| `BATCH_CREATED` | `BatchCreatedEvent` | `POST /batches` succeeds |
| `BATCH_WEEK_ADVANCED` | `BatchWeekAdvancedEvent` | optimistic UPDATE returns row |
| `BATCH_PHASE_CHANGED` | `BatchPhaseChangedEvent` | FSM transitions phase |
| `MORTALITY_RECORDED` | `MortalityRecordedEvent` | mortality insert |
| `BATCH_TERMINATED` | `BatchTerminatedEvent` | terminate succeeds |

```ts
export interface BatchCreatedEvent {
  type: 'BATCH_CREATED';
  batch_id: string;
  farm_id: string;
  species: Species;
  duck_type: DuckType | null;
  production_system: ProductionSystem;
  start_date: string;
  initial_quantity: number;
  occurred_at: string;
}
export interface BatchWeekAdvancedEvent {
  type: 'BATCH_WEEK_ADVANCED';
  batch_id: string; farm_id: string;
  previous_week: number; new_week: number;
  occurred_at: string;
}
export interface BatchPhaseChangedEvent {
  type: 'BATCH_PHASE_CHANGED';
  batch_id: string; farm_id: string;
  previous_phase: BatchPhase; new_phase: BatchPhase;
  occurred_at: string;
}
export interface MortalityRecordedEvent {
  type: 'MORTALITY_RECORDED';
  batch_id: string; farm_id: string; count: number; cause: string;
  occurred_at: string;
}
export interface BatchTerminatedEvent {
  type: 'BATCH_TERMINATED';
  batch_id: string; farm_id: string; mode: 'normal'|'emergency';
  occurred_at: string;
}
```

**Consumers:**

- `BATCH_CREATED` → Water-Health (`HealthTaskGenService.generateInitial`), Feed (no-op until first formulation).
- `BATCH_WEEK_ADVANCED` → Water-Health (regenerate weekly schedule), Feed (offer phase-transition formulation), Egg Production (enable from layer Week 19+ / duck-layer Week 20+, CONVENTIONS §2.1, §2.7).
- `MORTALITY_RECORDED` → Water-Health (recompute dose with new population).

---

## 7. Background Jobs (pg-boss)

```ts
// artifacts/api-server/src/jobs/batch-jobs.ts
import PgBoss from 'pg-boss';

// Sunday midnight in farm timezone (CONVENTIONS §2.11).
// One scheduled job per farm to honour per-farm tz override.
export async function registerBatchJobs(boss: PgBoss, farm: { id: string; timezone: string }) {
  await boss.schedule(
    `advance-batch-weeks-${farm.id}`,
    '0 0 * * 0',
    { farmId: farm.id },
    { tz: farm.timezone },   // e.g. 'Africa/Accra'
  );
}

export async function advanceBatchWeeksHandler(job: PgBoss.Job<{ farmId: string }>) {
  const farmId = job.data.farmId;
  const active = await db.select().from(batches)
    .where(and(eq(batches.farm_id, farmId), notInArray(batches.phase, ['terminated','ready_to_sell'])));
  for (const b of active) {
    try {
      await batchService.advanceWeek({ batchId: b.id, farmId, expectedCurrentWeek: b.current_week });
    } catch (e) {
      if (isHttpError(e, 'WEEK_ADVANCE_RACED')) continue;   // farmer beat us; fine
      throw e;
    }
  }
}
```

The `checkWithdrawalPeriods` job (every 4 h, UTC) lives in the Water-Health module and emits `CLEAR_WITHDRAWAL` events that this module reacts to.

---

## 8. Business Rules & Invariants

1. **R-BM-1** A house may host only one non-terminated batch at a time.
2. **R-BM-2** `species = 'duck'` ⇒ `duck_type ∈ {meat, layer}` chosen at wizard Step 1b.
3. **R-BM-3** `species ∈ {broiler, layer}` ⇒ `production_system = 'intensive'`.
4. **R-BM-4** `initial_quantity ≤ house.capacity`.
5. **R-BM-5** `current_quantity = initial_quantity - SUM(mortality_events.count)`; never negative.
6. **R-BM-6** Week advancement uses the optimistic UPDATE in §5.4; zero rows ⇒ HTTP 409 `WEEK_ADVANCE_RACED` (CONVENTIONS §2.14).
7. **R-BM-7** Phase boundaries follow §2.3; FSM `always` transitions move the batch forward as soon as `current_week` crosses the boundary.
8. **R-BM-8** `TERMINATE_NORMAL` is rejected (HTTP 409 `WITHDRAWAL_ACTIVE`) when `has_active_withdrawal = true`. The XState machine reflects this by omitting the transition from the `withdrawal` state.
9. **R-BM-9** `EMERGENCY_TERMINATE` is always allowed and sets `termination_reason = 'emergency'`.
10. **R-BM-10** Layer egg production becomes available at **Week 19+** (CONVENTIONS §2.1). Duck-layer egg production at **Week 20+** (CONVENTIONS §2.7).
11. **R-BM-11** Layer cycle length is configurable 72–78 weeks, default 78 (CONVENTIONS §2.4).
12. **R-BM-12** Turkey cycle length is configurable 12–20 weeks, default 16 (CONVENTIONS §2.5).
13. **R-BM-13** Duck cycle length depends on `duck_type`: meat 8–10, layer 72+ (CONVENTIONS §2.6).
14. **R-BM-14** Every farm-scoped query MUST include `farm_id` in its `WHERE` clause (CONVENTIONS §4.9).
15. **R-BM-15** All write endpoints accept `Idempotency-Key`; replays return the original response (CONVENTIONS §4.5).

---

## 9. Error Codes

| Code | HTTP | Meaning |
|---|---|---|
| `HOUSE_OCCUPIED` | 409 | Selected house already hosts a non-terminated batch |
| `QUANTITY_EXCEEDS_CAPACITY` | 422 | `initial_quantity > house.capacity` |
| `DUCK_TYPE_REQUIRED` | 422 | Duck batch missing `duck_type` |
| `INVALID_PRODUCTION_SYSTEM` | 422 | Broiler/layer with `semi_intensive` |
| `WEEK_ADVANCE_RACED` | 409 | Optimistic lock failed |
| `WITHDRAWAL_ACTIVE` | 409 | `terminate normal` blocked by active withdrawal |
| `MORTALITY_EXCEEDS_POPULATION` | 422 | `count > current_quantity` |
| `BATCH_TERMINATED` | 409 | Mutation attempted on a terminated batch |

---

## 10. Observability

Per CONVENTIONS §4.8. Domain-specific log fields:

- `batch_id`, `farm_id`, `species`, `duck_type`, `phase`, `current_week`.
- On `WEEK_ADVANCE_RACED`: log `expected_current_week` and the persisted `current_week`.

Metrics (Prom-style):

- `batch_active_total{farm_id, species}` — gauge.
- `batch_week_advances_total{farm_id, source=manual|scheduler}` — counter.
- `batch_week_advance_conflicts_total{farm_id}` — counter.
- `batch_terminated_total{farm_id, mode}` — counter.

---

## 11. Test Plan

Vitest + supertest in `artifacts/api-server/test/batch/`. Required cases (one per rule):

1. Wizard rejects duck without `duck_type` (R-BM-2).
2. Wizard rejects broiler with `semi_intensive` (R-BM-3).
3. Wizard rejects `initial_quantity > capacity` (R-BM-4).
4. Two batches on the same house — second fails with `HOUSE_OCCUPIED` (R-BM-1).
5. Concurrent `advance-week` calls: one wins, one returns 409 `WEEK_ADVANCE_RACED` (R-BM-6).
6. FSM: broiler `current_week = 4` ⇒ phase = `grower` (R-BM-7).
7. FSM: layer `current_week = 19` ⇒ phase = `finisher` and egg production becomes enabled (R-BM-10).
8. FSM: `TERMINATE_NORMAL` while `has_active_withdrawal = true` rejected (R-BM-8).
9. FSM: `EMERGENCY_TERMINATE` always succeeds (R-BM-9).
10. Mortality > current_quantity rejected (R-BM-5).
11. Idempotent create: same `Idempotency-Key` returns the same response (R-BM-15).
12. Cross-farm read attempt returns 404 (R-BM-14).
13. Step 3 wizard preview: broiler shows **5 vaccinations**; layer (rearing) shows **11**; duck-meat shows the duck-meat count; turkey shows turkey count (CONVENTIONS §2.8 + species protocols).
14. Layer cycle length defaults to 78, accepts 72 (R-BM-11).
15. Turkey cycle length defaults to 16, accepts 12 and 20 (R-BM-12).
16. Duck-meat default 10, duck-layer default 78 (R-BM-13).

---

## 12. Wizard UI Notes

The original wireframes in `attached_assets/Batch_Management_System_—_LampFarms_1777797779755.md` are correct in layout but contain the following errors that the rewritten frontend must fix:

- **Step 1 species card:** Layer card subtitle must read **"72–78 weeks"** (not 68); Duck card must read **"meat 8–10 / layer 72+ weeks"** (not "10 / 68").
- **Step 1b (NEW)** appears **only when species = duck**. Two cards: "Meat Duck (8–10 weeks) — no eggs" and "Layer Duck (72+ weeks) — eggs from Week 20+". Sets `duck_type` on the batch payload (CONVENTIONS §2.6).
- **Step 2** unchanged.
- **Step 3 review** "Automatic Setup" block lists the actual scheduled health-task counts loaded from the species protocol:
  - Broiler: **5 vaccinations** scheduled (Day 7 Gumboro, Day 14 HB1, Day 21 Gumboro+, Day 28 Lasota, Day 35 Gumboro+) — CONVENTIONS §2.8.
  - Layer (rearing): **11 vaccinations** scheduled across Weeks 1–18 per the layer protocol.
  - Duck-meat: per duck protocol.
  - Duck-layer: per duck-layer protocol (includes Duck Viral Hepatitis subcutaneous, see `03_WATER_HEALTH.md` §3.4).
  - Turkey: per turkey protocol (includes Metronidazole every 2 weeks for Blackhead, see `03_WATER_HEALTH.md` §4).
- "Lifecycle FSM initialized (8 states)" remains accurate.

---

## 12 (continued). Open Questions

1. Should `cycle_length_weeks` be editable mid-batch (e.g. farmer extends turkey to 20 weeks at week 14)? Current spec: yes, via `PATCH /batches/:id`. Confirm.
2. Layer batches running past Week 78: hard-stop or warn-and-allow? Current spec: warn only; termination still requires explicit `TERMINATE_NORMAL`.
3. Multi-house batch (same cohort split across two houses): out of scope for v2.

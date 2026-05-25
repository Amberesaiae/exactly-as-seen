# Feed Calculator System

**Status:** Spec v2 (rewritten 2026-05-03)
**Module path:** `artifacts/api-server/src/modules/feed`
**Owner:** TBD

> Source: `attached_assets/Feed_Calculator_System_—_LampFarms_1777797779760.md`. Conventions in `00_CONVENTIONS.md` supersede the original.

---

## 1. Purpose & Scope

The Feed Calculator produces cost-minimised feed formulations that meet phase-specific nutritional requirements for a batch.

In scope:

- **Two modes** offered to the farmer:
  - **Automatic (LP)** — solver picks ingredient quantities to minimise cost subject to nutritional + safety constraints. Solver = **`highs-js`** (CONVENTIONS §1).
  - **Flexible (manual)** — farmer supplies quantities; the system validates and shows nutritional/cost summary but does not block.
- Ready-Made and Concentrate-Mix helpers (simple arithmetic; no LP).
- Safety Preprocessor:
  - Aflatoxin toxin binder is **always compulsory** (CONVENTIONS unchanged).
  - **Duck niacin is no longer added here** — it is a Water-Health auto-task (CONVENTIONS §2.9, see `03_WATER_HEALTH.md` §3.3).
  - Cotton-seed-cake blocked for layers (gossypol).
  - Fish-meal cap at 10% for broilers (warn).
  - Single calcium source (replace on second selection).
- Graceful fallback: solver infeasible / timeout / WASM error → return a **Flexible Mix** seeded with the farmer's ingredients and surface a recoverable error code.
- Confirmation flow that publishes `FEED_FORMULATION_CONFIRMED` (consumed by Stock + Finance for intensive batches).

Out of scope: the actual stock allocation and expense creation (consumed elsewhere).

---

## 2. Domain Model

```ts
export type FeedMode = 'automatic' | 'flexible' | 'ready_made' | 'concentrate_mix';
export type FeedPhase = 'starter' | 'grower' | 'finisher' | 'layer_production';

export interface Ingredient {
  id: string;                            // 'maize', 'soybean_meal', 'oyster_shell', 'toxin_binder'
  name: string;
  category: 'energy' | 'protein_primary' | 'protein_secondary'
          | 'calcium' | 'compulsory_supplement' | 'optional_supplement';
  // Per-kg nutrition (analytic constants from nutritional_requirements.json)
  protein_pct: number;                   // 0..1
  energy_kcal_per_kg: number;
  calcium_pct: number;
  phosphorus_pct: number;
  lysine_pct: number;
  methionine_pct: number;
  // Safety flags
  contains_aflatoxin_risk: boolean;      // maize, groundnut cake
  contains_gossypol: boolean;            // cotton seed cake
  is_fish_meal: boolean;
  is_toxin_binder: boolean;
}

export interface IngredientLot {
  ingredient_id: string;
  source: 'stock' | 'new_purchase';
  available_kg: number;                  // if from stock
  cost_per_kg_pesewas: number;
}

export interface NutritionalRequirement {
  species: 'broiler' | 'layer' | 'duck' | 'turkey' | 'other';
  duck_type: 'meat' | 'layer' | null;
  phase: FeedPhase;
  protein_min_pct: number;
  energy_min_kcal_per_kg: number;
  energy_max_kcal_per_kg: number;
  calcium_min_pct: number;
  calcium_max_pct: number;
  phosphorus_min_pct: number;
  lysine_min_pct: number;
  methionine_min_pct: number;
}

export interface FormulationLine {
  ingredient_id: string;
  source: 'stock' | 'new_purchase';
  quantity_kg: number;
  cost_pesewas: number;
  auto_added: boolean;
}

export interface Formulation {
  id: string;
  farm_id: string;
  batch_id: string;
  mode: FeedMode;
  phase: FeedPhase;
  target_kg: number;
  lines: FormulationLine[];
  total_cost_pesewas: number;
  cost_per_kg_pesewas: number;
  solver_status: 'optimal' | 'infeasible' | 'timeout' | 'fallback' | 'manual';
  meets_requirements: boolean;
  warnings: string[];
  confirmed_at: string | null;
  created_at: string;
}
```

---

## 3. Drizzle Schema

```ts
// artifacts/api-server/src/db/schema/feed.ts
import {
  pgTable, text, integer, real, boolean, timestamp, jsonb, index,
} from 'drizzle-orm/pg-core';

export const ingredients = pgTable('ingredients', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  category: text('category', { enum: [
    'energy','protein_primary','protein_secondary',
    'calcium','compulsory_supplement','optional_supplement',
  ]}).notNull(),
  protein_pct: real('protein_pct').notNull().default(0),
  energy_kcal_per_kg: real('energy_kcal_per_kg').notNull().default(0),
  calcium_pct: real('calcium_pct').notNull().default(0),
  phosphorus_pct: real('phosphorus_pct').notNull().default(0),
  lysine_pct: real('lysine_pct').notNull().default(0),
  methionine_pct: real('methionine_pct').notNull().default(0),
  contains_aflatoxin_risk: boolean('contains_aflatoxin_risk').notNull().default(false),
  contains_gossypol: boolean('contains_gossypol').notNull().default(false),
  is_fish_meal: boolean('is_fish_meal').notNull().default(false),
  is_toxin_binder: boolean('is_toxin_binder').notNull().default(false),
});

export const nutritional_requirements = pgTable('nutritional_requirements', {
  id: text('id').primaryKey(),
  species: text('species').notNull(),
  duck_type: text('duck_type'),
  phase: text('phase', { enum: ['starter','grower','finisher','layer_production'] }).notNull(),
  protein_min_pct: real('protein_min_pct').notNull(),
  energy_min_kcal_per_kg: real('energy_min_kcal_per_kg').notNull(),
  energy_max_kcal_per_kg: real('energy_max_kcal_per_kg').notNull(),
  calcium_min_pct: real('calcium_min_pct').notNull(),
  calcium_max_pct: real('calcium_max_pct').notNull(),
  phosphorus_min_pct: real('phosphorus_min_pct').notNull(),
  lysine_min_pct: real('lysine_min_pct').notNull(),
  methionine_min_pct: real('methionine_min_pct').notNull(),
});

export const formulations = pgTable('formulations', {
  id: text('id').primaryKey(),
  farm_id: text('farm_id').notNull(),
  batch_id: text('batch_id').notNull(),
  mode: text('mode', { enum: ['automatic','flexible','ready_made','concentrate_mix'] }).notNull(),
  phase: text('phase', { enum: ['starter','grower','finisher','layer_production'] }).notNull(),
  target_kg: real('target_kg').notNull(),
  lines: jsonb('lines').$type<FormulationLine[]>().notNull(),
  total_cost_pesewas: integer('total_cost_pesewas').notNull(),
  cost_per_kg_pesewas: integer('cost_per_kg_pesewas').notNull(),
  solver_status: text('solver_status', {
    enum: ['optimal','infeasible','timeout','fallback','manual']
  }).notNull(),
  meets_requirements: boolean('meets_requirements').notNull(),
  warnings: jsonb('warnings').$type<string[]>().notNull().default([]),
  confirmed_at: timestamp('confirmed_at', { withTimezone: true }),
  created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  farm_batch_idx: index('formulations_farm_batch_idx').on(t.farm_id, t.batch_id),
}));
```

### 3.1 Drizzle Schema: feed_schedules table

The `feed_schedules` table stores the generated daily feeding schedules for each active batch.

```ts
export const feed_schedules = pgTable('feed_schedules', {
  id: text('id').primaryKey(),
  batch_id: text('batch_id').notNull(),
  farm_id: text('farm_id').notNull(),
  week: integer('week').notNull(),
  day: integer('day').notNull(),
  amount_per_bird_g: real('amount_per_bird_g').notNull(),
  total_amount_kg: real('total_amount_kg').notNull(),
  completed: boolean('completed').notNull().default(false),
  completed_at: timestamp('completed_at', { withTimezone: true }),
  created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});
```

---

## 4. State Machine

Formulations have no FSM. They are immutable once created; `confirmed_at` is set on `POST /confirm`. Stale (unconfirmed) formulations are pruned by a daily cleanup job.

---

## 5. Public API

Mounted under `/api/v1/feed`.

### 5.1 `POST /feed/optimize` — automatic (LP) mode

```ts
export const OptimizeInput = z.object({
  id: z.string().uuid(),                              // UUIDv7 client-generated
  batch_id: z.string().uuid(),
  phase: z.enum(['starter','grower','finisher','layer_production']),
  target_kg: z.number().positive(),
  ingredient_lots: z.array(z.object({
    ingredient_id: z.string(),
    source: z.enum(['stock','new_purchase']),
    available_kg: z.number().nonnegative(),           // Infinity for new_purchase
    cost_per_kg_pesewas: z.number().int().nonnegative(),
  })).min(1),
});

export const OptimizeResponse = z.object({
  formulation: FormulationSchema,                     // includes solver_status
  fallback_used: z.boolean(),
  fallback_reason: z.string().nullable(),
});
```

Behaviour:

1. Run **Safety Preprocessor** (§6).
2. Solve via `highs-js` (§7) with a hard timeout (default 5 s).
3. On `optimal` → persist formulation with `solver_status = 'optimal'`.
4. On `infeasible` / `timeout` / WASM error → run the **Flexible fallback** (§8): persist `solver_status = 'fallback'`, `meets_requirements = false`, return 200 with `fallback_used = true` and `fallback_reason ∈ {LP_INFEASIBLE, LP_TIMEOUT, LP_WASM_ERROR}`.

### 5.2 `POST /feed/flexible` — flexible (manual) mode

```ts
export const FlexibleInput = z.object({
  id: z.string().uuid(),
  batch_id: z.string().uuid(),
  phase: z.enum(['starter','grower','finisher','layer_production']),
  target_kg: z.number().positive(),
  lines: z.array(z.object({
    ingredient_id: z.string(),
    source: z.enum(['stock','new_purchase']),
    quantity_kg: z.number().nonnegative(),
    cost_per_kg_pesewas: z.number().int().nonnegative(),
  })).min(1),
});
export const FlexibleResponse = z.object({ formulation: FormulationSchema });
```

Runs Safety Preprocessor (auto-adds toxin binder if missing); does **not** run LP. Computes nutrition totals; sets `meets_requirements` and emits warnings but never blocks.

### 5.3 `POST /feed/ready-made`

```ts
export const ReadyMadeInput = z.object({
  id: z.string().uuid(),
  batch_id: z.string().uuid(),
  phase: z.enum(['starter','grower','finisher','layer_production']),
  brand: z.string(),
  bag_count: z.number().int().positive(),
  bag_size_kg: z.number().positive(),
  price_per_bag_pesewas: z.number().int().positive(),
});
export const ReadyMadeResponse = z.object({ formulation: FormulationSchema });
```

Pure arithmetic. `mode = 'ready_made'`, `solver_status = 'manual'`.

### 5.4 `POST /feed/concentrate-mix`

```ts
export const ConcentrateMixInput = z.object({
  id: z.string().uuid(),
  batch_id: z.string().uuid(),
  phase: z.enum(['starter','grower','finisher','layer_production']),
  target_kg: z.number().positive(),
  concentrate_ingredient_id: z.string(),
  grain_ingredient_id: z.string(),
  concentrate_pct: z.number().min(0.30).max(0.50),    // 30%..50% (slider 30:70 → 50:50)
  concentrate_cost_per_kg_pesewas: z.number().int().nonnegative(),
  grain_cost_per_kg_pesewas: z.number().int().nonnegative(),
});
export const ConcentrateMixResponse = z.object({ formulation: FormulationSchema });
```

### 5.5 `POST /feed/:id/confirm`

```ts
export const ConfirmInput = z.object({});
export const ConfirmResponse = z.object({ formulation: FormulationSchema });
```

Sets `confirmed_at = now`, publishes `FEED_FORMULATION_CONFIRMED`. Idempotent on `Idempotency-Key`.

### 5.6 `GET /feed/batches/:batchId/history`

```ts
export const HistoryResponse = z.object({
  items: z.array(FormulationSchema),
  next_cursor: z.string().nullable(),
});
```

### 5.7 `GET /feed/ingredients` / `GET /feed/requirements`

Read-only catalogue endpoints.

---

## 6. Safety Preprocessor

Implementation in `artifacts/api-server/src/modules/feed/safety.ts`.

```ts
export interface PreprocessResult {
  ingredient_lots: IngredientLot[];     // possibly augmented
  forced_lines: FormulationLine[];      // compulsory adds (e.g. toxin binder)
  warnings: string[];
  blocked: { ingredient_id: string; reason: string }[];
}

export function preprocess(args: {
  species: 'broiler'|'layer'|'duck'|'turkey'|'other';
  duck_type: 'meat'|'layer'|null;
  phase: FeedPhase;
  ingredient_lots: IngredientLot[];
}): PreprocessResult;
```

Rules:

1. **R-FC-1 (Aflatoxin binder, COMPULSORY).** If any selected ingredient has `contains_aflatoxin_risk = true` (maize, groundnut cake) — or unconditionally if `species ∈ {broiler, layer, duck, turkey}` — append `toxin_binder` at **0.5% of `target_kg`**, `auto_added = true`, sourced from stock if available else `new_purchase` at the system default price. Cannot be removed by the farmer.
2. **R-FC-2 (Gossypol block).** If `species = 'layer'` and any selected ingredient `contains_gossypol = true` (cotton-seed cake) → block, with `LAYER_GOSSYPOL_BLOCKED`.
3. **R-FC-3 (Fish meal cap).** If `species = 'broiler'` and post-LP fish-meal share would exceed 10% of `target_kg` → cap the LP upper bound at 10% and emit warning `BROILER_FISH_MEAL_CAPPED`.
4. **R-FC-4 (Single calcium source).** If multiple `category = 'calcium'` ingredients are supplied, keep only the last selection; emit warning `CALCIUM_SOURCE_REPLACED`.
5. **R-FC-5 (Duck niacin removed).** No niacin is added here. Duck niacin is generated by Water-Health (CONVENTIONS §2.9, see `03_WATER_HEALTH.md` §3.3). The Safety Preprocessor MUST NOT inject a niacin line.

---

## 7. LP Solver (`highs-js`)

```ts
// artifacts/api-server/src/modules/feed/lp.ts
import highsLoader from 'highs-js';

let highsPromise: Promise<any> | null = null;
async function getHighs() {
  if (!highsPromise) highsPromise = highsLoader();
  return highsPromise;
}

export interface LpInput {
  ingredients: { id: string; cost_per_kg_pesewas: number; available_kg: number;
                 protein_pct: number; energy_kcal_per_kg: number;
                 calcium_pct: number; phosphorus_pct: number;
                 lysine_pct: number; methionine_pct: number;
                 max_share: number | null; }[];      // e.g. 0.10 for fish meal in broilers
  requirement: NutritionalRequirement;
  target_kg: number;
  forced_kg: Record<string, number>;                  // e.g. { toxin_binder: 2.5 }
}

export interface LpOutput {
  status: 'optimal' | 'infeasible' | 'timeout' | 'error';
  quantities_kg: Record<string, number>;
  total_cost_pesewas: number;
}

export async function solveFeedLP(input: LpInput, timeoutMs = 5000): Promise<LpOutput> {
  const highs = await getHighs();

  // Decision variables: x_i = kg of ingredient i ; nVars = ingredients.length
  const ings = input.ingredients;
  const n = ings.length;

  // Objective: minimize sum(cost_i * x_i) (in pesewas)
  // Constraints (all per kg of total):
  //   sum(x_i)                       == target_kg                     (mass)
  //   sum(protein_pct_i * x_i)       >= protein_min * target_kg
  //   sum(energy_i * x_i)            >= energy_min  * target_kg
  //   sum(energy_i * x_i)            <= energy_max  * target_kg
  //   sum(calcium_pct_i * x_i)       >= calcium_min * target_kg
  //   sum(calcium_pct_i * x_i)       <= calcium_max * target_kg
  //   sum(phosphorus_pct_i * x_i)    >= phosphorus_min * target_kg
  //   sum(lysine_pct_i * x_i)        >= lysine_min * target_kg
  //   sum(methionine_pct_i * x_i)    >= methionine_min * target_kg
  // Bounds:
  //   0 <= x_i <= min(available_kg_i, max_share_i * target_kg ?? Inf)
  //   x_i      == forced_kg[i] when present (lb=ub=value)
  //
  // The HiGHS JS API accepts an LP in CPLEX-LP text form via highs.solve(modelText, options).
  // We construct it programmatically:

  const lp = buildCplexLp({ ings, req: input.requirement, target: input.target_kg, forced: input.forced_kg });

  const timer = new Promise<LpOutput>((resolve) =>
    setTimeout(() => resolve({ status: 'timeout', quantities_kg: {}, total_cost_pesewas: 0 }), timeoutMs));

  const work = (async (): Promise<LpOutput> => {
    try {
      const result = highs.solve(lp, { time_limit: timeoutMs / 1000, output_flag: false });
      if (result.Status === 'Optimal') {
        const quantities_kg: Record<string, number> = {};
        for (const col of Object.values<any>(result.Columns)) {
          quantities_kg[col.Name] = col.Primal;
        }
        const total = ings.reduce((acc, ing) =>
          acc + Math.round((quantities_kg[ing.id] ?? 0) * ing.cost_per_kg_pesewas), 0);
        return { status: 'optimal', quantities_kg, total_cost_pesewas: total };
      }
      if (result.Status === 'Infeasible') {
        return { status: 'infeasible', quantities_kg: {}, total_cost_pesewas: 0 };
      }
      return { status: 'error', quantities_kg: {}, total_cost_pesewas: 0 };
    } catch {
      return { status: 'error', quantities_kg: {}, total_cost_pesewas: 0 };
    }
  })();

  return Promise.race([work, timer]);
}
```

`buildCplexLp` emits a string of the form:

```
Minimize
 obj: 11500 x_maize + 38000 x_soybean_meal + 3500 x_oyster_shell + 0 x_toxin_binder
Subject To
 mass:        x_maize + x_soybean_meal + x_oyster_shell + x_toxin_binder = 500
 protein:     0.085 x_maize + 0.44 x_soybean_meal + 0 x_oyster_shell + 0 x_toxin_binder >= 90
 energy_min:  3350 x_maize + 2230 x_soybean_meal + 0 x_oyster_shell + 0 x_toxin_binder >= 1550000
 ...
Bounds
 0 <= x_maize <= 400
 x_toxin_binder = 2.5
End
```

---

## 8. Fallback Behaviour

When `solveFeedLP` returns `status ∈ {infeasible, timeout, error}`:

1. Build a `Formulation` in `flexible` mode with the farmer's `ingredient_lots` taken at face value (quantities defaulted to even shares of `target_kg`, less the forced lines).
2. Run nutrition totals; set `meets_requirements = false` and append warning, e.g. `LP_INFEASIBLE_FALLBACK_TO_FLEXIBLE`.
3. Persist with `solver_status = 'fallback'`, `mode = 'automatic'` (so the audit trail records it as an automatic attempt that fell back).
4. Return HTTP 200 with `fallback_used = true` and `fallback_reason`.

The UI surfaces a banner: "Could not auto-optimise — switched to Flexible Mix. Adjust quantities below."

---

## 9. Events Published / Consumed

```ts
export interface FeedFormulationCreatedEvent {
  type: 'FEED_FORMULATION_CREATED';
  formulation_id: string; batch_id: string; farm_id: string;
  mode: FeedMode; solver_status: 'optimal'|'infeasible'|'timeout'|'fallback'|'manual';
  occurred_at: string;
}
export interface FeedFormulationConfirmedEvent {
  type: 'FEED_FORMULATION_CONFIRMED';
  formulation_id: string; batch_id: string; farm_id: string;
  total_cost_pesewas: number;
  lines: { ingredient_id: string; source: 'stock'|'new_purchase'; quantity_kg: number; cost_pesewas: number }[];
  production_system: 'intensive' | 'semi_intensive';
  occurred_at: string;
}
```

**Consumed:**

- `BATCH_CREATED` — none directly; the UI offers a "Plan starter feed" prompt.
- `BATCH_PHASE_CHANGED` — UI prompts farmer to formulate the new phase.

**Consumers of `FEED_FORMULATION_CONFIRMED`:**

- Stock module (intensive only): allocate `source = 'stock'` lines (FIFO + quality, CONVENTIONS §2.15).
- Finance module (intensive only): create expense for `source = 'new_purchase'` lines and stock-allocated lines at lot cost.

---

## 10. Background Jobs

```ts
// artifacts/api-server/src/jobs/feed-jobs.ts
import PgBoss from 'pg-boss';

export async function registerFeedJobs(boss: PgBoss) {
  // Daily 03:00 UTC — prune unconfirmed formulations older than 7 days.
  await boss.schedule('feed-prune', '0 3 * * *', {});
}

export async function feedPruneHandler(_job: PgBoss.Job) {
  await db.delete(formulations).where(and(
    isNull(formulations.confirmed_at),
    lt(formulations.created_at, sql`now() - interval '7 days'`),
  ));
}
```

---

## 11. Business Rules & Invariants

1. **R-FC-1** Aflatoxin toxin binder is auto-added at 0.5% of `target_kg`, cannot be removed.
2. **R-FC-2** Cotton-seed cake blocked for layers (gossypol).
3. **R-FC-3** Fish meal capped at 10% for broilers.
4. **R-FC-4** Only one calcium source per formulation; second selection replaces first.
5. **R-FC-5** Duck niacin is **not** added by the Safety Preprocessor (CONVENTIONS §2.9). It is a Water-Health task.
6. **R-FC-6** Automatic mode uses `highs-js` LP with a 5 s timeout.
7. **R-FC-7** On solver failure (infeasible / timeout / WASM error) the API returns HTTP 200 with a fallback Flexible Mix and `solver_status = 'fallback'`.
8. **R-FC-8** Flexible mode never blocks; it surfaces warnings + nutrition totals.
9. **R-FC-9** All money fields are integer pesewas (CONVENTIONS §4.2).
10. **R-FC-10** `FEED_FORMULATION_CONFIRMED` is only published once per formulation (idempotent via `Idempotency-Key`).
11. **R-FC-11** Stock allocation downstream uses FIFO + quality (CONVENTIONS §2.15) — see Stock spec.
12. **R-FC-12** Every farm-scoped query includes `farm_id`.
13. **R-FC-13** `target_kg = sum(lines.quantity_kg)` (mass-balance) within ±0.5 kg tolerance.
14. **R-FC-14** Phase derivation: `layer_production` is used iff `species = 'layer'` AND `current_week >= 19` (CONVENTIONS §2.1) OR (`species = 'duck'` AND `duck_type = 'layer'` AND `current_week >= 20`, CONVENTIONS §2.7).

---

## 12. Error Codes

| Code | HTTP | Meaning |
|---|---|---|
| `LAYER_GOSSYPOL_BLOCKED` | 422 | Cotton seed cake supplied for a layer batch |
| `LP_INFEASIBLE` | 200 (in body) | Solver returned infeasible; fallback used |
| `LP_TIMEOUT` | 200 (in body) | Solver exceeded 5 s; fallback used |
| `LP_WASM_ERROR` | 200 (in body) | `highs-js` threw; fallback used |
| `MASS_BALANCE_FAILED` | 422 | Flexible lines do not sum to `target_kg` |
| `INGREDIENT_NOT_FOUND` | 404 | Unknown `ingredient_id` |
| `FORMULATION_ALREADY_CONFIRMED` | 409 | Confirm called twice without idempotency replay |

---

## 13. Observability

Log fields: `formulation_id`, `batch_id`, `farm_id`, `mode`, `solver_status`, `solve_ms`, `target_kg`. Metrics:

- `feed_optimize_total{farm_id, status}` — counter (`optimal`, `infeasible`, `timeout`, `error`).
- `feed_solve_duration_ms` — histogram.
- `feed_fallback_total{reason}` — counter.
- `feed_confirmed_total{farm_id, mode}` — counter.

---

## 14. Test Plan

Vitest + supertest in `artifacts/api-server/test/feed/`.

1. Auto mode, broiler-finisher, valid ingredients → `solver_status = 'optimal'` and `meets_requirements = true` (R-FC-6).
2. Auto mode, layer + cotton-seed cake → 422 `LAYER_GOSSYPOL_BLOCKED` (R-FC-2).
3. Auto mode, broiler with fish-meal lot 200 kg of 500 kg target → final `fish_meal` line ≤ 50 kg, warning `BROILER_FISH_MEAL_CAPPED` (R-FC-3).
4. Auto mode, two calcium ingredients selected → only the last persists (R-FC-4).
5. Auto mode, all ingredients have aflatoxin risk = false → toxin binder still appended at 0.5% (R-FC-1).
6. Auto mode, infeasible problem (e.g. only maize provided for a 22% protein starter) → 200 with `fallback_used = true`, `fallback_reason = 'LP_INFEASIBLE'`, `solver_status = 'fallback'` (R-FC-7).
7. Auto mode, mocked solver throw → `LP_WASM_ERROR` fallback (R-FC-7).
8. Auto mode, mocked timeout → `LP_TIMEOUT` fallback (R-FC-7).
9. Flexible mode, missing toxin binder → auto-added; never blocks (R-FC-1, R-FC-8).
10. Flexible mode, lines sum ≠ target_kg → 422 `MASS_BALANCE_FAILED` (R-FC-13).
11. **Duck batch (any phase) — formulation MUST NOT contain a niacin line** (R-FC-5). Verify against both auto and flexible modes.
12. Confirm twice without idempotency key → second call 409 `FORMULATION_ALREADY_CONFIRMED`; with same `Idempotency-Key` → identical 200 (R-FC-10).
13. Layer week 19 batch → phase derives to `layer_production` (R-FC-14).
14. Duck-layer week 20 batch → phase derives to `layer_production` (R-FC-14).
15. Cross-farm read 404 (R-FC-12).
16. `FEED_FORMULATION_CONFIRMED` payload includes per-line `source` for downstream Stock/Finance (R-FC-11).

---

## 15. Open Questions

1. Should `forced_kg` for toxin binder be 0.5% (industry standard) or 0.25%? Defaulted to 0.5%; confirm with vet.
2. Solver timeout (5 s) is generous for ≤ 41-variable problems; revisit after benchmarking on Replit infrastructure.
3. Concentrate-Mix nutrition validation: currently arithmetic only. Should it surface the same warnings as Flexible mode? Likely yes — TBD.

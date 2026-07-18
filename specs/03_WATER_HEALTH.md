# Water-Health System

**Status:** Spec v2 (rewritten 2026-05-03)
**Module path:** `artifacts/api-server/src/modules/water-health`
**Owner:** TBD

> Source: `attached_assets/Water-Health_System_—_LampFarms_1777797779757.md`. Conventions in `00_CONVENTIONS.md` supersede the original.

---

## 1. Purpose & Scope

The Water-Health module is the most operationally critical system in LampFarms. It generates and tracks every medication, vaccination, and treatment event for every active batch.

In scope:

- Day-1 chick arrival protocol (auto-generated on `BATCH_CREATED`).
- Weekly health-task generation per batch (species + week + population + duck_type).
- Container-based dosing using the medication record's `dose_per_gallon` (CONVENTIONS §2.13).
- Medication database (52+ products including **Metronidazole** for turkey blackhead, CONVENTIONS §2.10).
- Unified conflict matrix C1–C8 (CONVENTIONS §2.2) with **72-hour** vaccine + antibiotic guard.
- Withdrawal-period tracking (drives `ENTER_WITHDRAWAL` / `CLEAR_WITHDRAWAL` to the batch FSM, see `02_BATCH_MANAGEMENT.md` §4.3).
- Delivery-method handling for non-water vaccines (CONVENTIONS §2.12).
- Duck niacin auto-task (CONVENTIONS §2.9).
- Traditional remedies (duck/turkey only).

Out of scope: feed-borne medication (see `04_FEED_CALCULATOR.md`).

---

## 2. Domain Model

```ts
export type MedicationCategory =
  | 'coccidiostat' | 'antibiotic' | 'dewormer'
  | 'vitamin_electrolyte' | 'antifungal' | 'antiprotozoal'
  | 'vaccine' | 'supplement';

// CONVENTIONS §2.12
export type DeliveryMethod =
  | 'drinking_water'
  | 'injection_subcutaneous'
  | 'injection_wing_web'
  | 'in_feed'
  | 'topical';

export type DoseUnit = 'tsp' | 'tbsp' | 'ml' | 'g';

export interface Medication {
  id: string;                            // e.g. 'amprolium', 'metronidazole'
  name: string;                          // 'Amprolium (CORID)'
  category: MedicationCategory;
  active_ingredient: string;
  delivery_method: DeliveryMethod;       // CONVENTIONS §2.12
  dose_per_gallon: number;               // CONVENTIONS §2.13
  dose_unit: DoseUnit;
  dose_per_bird_ml: number | null;       // for injections; null otherwise
  injection_site: string | null;         // 'subcutaneous (neck)', 'wing web'
  withdrawal_meat_days: number;
  withdrawal_eggs_days: number;
  is_live_vaccine: boolean;
  is_sulfa: boolean;
  is_tetracycline: boolean;
  contains_calcium: boolean;
  is_activated_charcoal: boolean;
  notes: string | null;
}

// CONVENTIONS §2.3 — exactly 9 container types
export type ContainerTypeId =
  | 'bell_drinker_small' | 'bell_drinker_1gal' | 'bell_drinker_6l'
  | 'local_drinker_10l' | 'jumbo_bell_14l'
  | 'bucket_5gal' | 'jerry_can_25l' | 'drum_50l' | 'nipple_tank_100l';

export interface ContainerType {
  id: ContainerTypeId;
  name: string;
  volume_l: number;
  volume_gal: number;
}

export type HealthTaskStatus =
  | 'scheduled' | 'pending' | 'completed' | 'skipped' | 'blocked';

export interface HealthTask {
  id: string;
  farm_id: string;
  batch_id: string;
  medication_id: string;
  delivery_method: DeliveryMethod;
  scheduled_date: string;                // ISO date, farm timezone
  window_days: number;                   // duration of treatment
  status: HealthTaskStatus;

  // Drinking water dosing (null for injections)
  container_type_id: ContainerTypeId | null;
  container_count: number | null;
  water_volume_l: number | null;
  computed_dose_amount: number | null;   // in dose_unit
  computed_dose_unit: DoseUnit | null;

  // Injection dosing (null for water)
  bird_count: number | null;             // current_quantity at generation time

  withdrawal_meat_until: string | null;
  withdrawal_eggs_until: string | null;
  cost_pesewas: number | null;
  completed_at: string | null;
  blocked_reason: string | null;         // conflict code (C1..C8) when status=blocked
  notes: string | null;
}
```

---

## 3. Drizzle Schema

```ts
// artifacts/api-server/src/db/schema/water-health.ts
import {
  pgTable, text, integer, boolean, timestamp, date, real, index, uniqueIndex,
} from 'drizzle-orm/pg-core';

export const medications = pgTable('medications', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  category: text('category', { enum: [
    'coccidiostat','antibiotic','dewormer','vitamin_electrolyte',
    'antifungal','antiprotozoal','vaccine','supplement',
  ]}).notNull(),
  active_ingredient: text('active_ingredient').notNull(),
  delivery_method: text('delivery_method', { enum: [
    'drinking_water','injection_subcutaneous','injection_wing_web','in_feed','topical',
  ]}).notNull().default('drinking_water'),
  dose_per_gallon: real('dose_per_gallon').notNull().default(0),
  dose_unit: text('dose_unit', { enum: ['tsp','tbsp','ml','g'] }).notNull().default('tsp'),
  dose_per_bird_ml: real('dose_per_bird_ml'),
  injection_site: text('injection_site'),
  withdrawal_meat_days: integer('withdrawal_meat_days').notNull().default(0),
  withdrawal_eggs_days: integer('withdrawal_eggs_days').notNull().default(0),
  is_live_vaccine: boolean('is_live_vaccine').notNull().default(false),
  is_sulfa: boolean('is_sulfa').notNull().default(false),
  is_tetracycline: boolean('is_tetracycline').notNull().default(false),
  contains_calcium: boolean('contains_calcium').notNull().default(false),
  is_activated_charcoal: boolean('is_activated_charcoal').notNull().default(false),
  notes: text('notes'),
});

export const container_types = pgTable('container_types', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  volume_l: real('volume_l').notNull(),
  volume_gal: real('volume_gal').notNull(),
});

export const health_tasks = pgTable('health_tasks', {
  id: text('id').primaryKey(),
  farm_id: text('farm_id').notNull(),
  batch_id: text('batch_id').notNull(),
  medication_id: text('medication_id').notNull().references(() => medications.id),
  delivery_method: text('delivery_method', { enum: [
    'drinking_water','injection_subcutaneous','injection_wing_web','in_feed','topical',
  ]}).notNull(),
  scheduled_date: date('scheduled_date').notNull(),
  window_days: integer('window_days').notNull().default(1),
  status: text('status', { enum: ['scheduled','pending','completed','skipped','blocked'] })
    .notNull().default('scheduled'),

  container_type_id: text('container_type_id').references(() => container_types.id),
  container_count: integer('container_count'),
  water_volume_l: real('water_volume_l'),
  computed_dose_amount: real('computed_dose_amount'),
  computed_dose_unit: text('computed_dose_unit', { enum: ['tsp','tbsp','ml','g'] }),

  bird_count: integer('bird_count'),

  withdrawal_meat_until: date('withdrawal_meat_until'),
  withdrawal_eggs_until: date('withdrawal_eggs_until'),
  cost_pesewas: integer('cost_pesewas'),
  completed_at: timestamp('completed_at', { withTimezone: true }),
  blocked_reason: text('blocked_reason'),
  notes: text('notes'),
  created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updated_at: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  batch_idx: index('health_tasks_batch_idx').on(t.batch_id),
  farm_status_idx: index('health_tasks_farm_status_idx').on(t.farm_id, t.status),
  withdrawal_meat_idx: index('health_tasks_withdrawal_meat_idx').on(t.withdrawal_meat_until),
}));
```

### 3.1 Container seed (CONVENTIONS §2.3 — 9 entries)

```ts
export const CONTAINER_SEED: ContainerType[] = [
  { id: 'bell_drinker_small', name: 'Small Bell Drinker',  volume_l: 1,   volume_gal: 0.26 },
  { id: 'bell_drinker_1gal',  name: 'Bell Drinker 1 gal',  volume_l: 3,   volume_gal: 0.79 },
  { id: 'bell_drinker_6l',    name: 'Bell Drinker 6L',     volume_l: 6,   volume_gal: 1.59 },
  { id: 'local_drinker_10l',  name: 'Local Drinker 10L',   volume_l: 10,  volume_gal: 2.64 },
  { id: 'jumbo_bell_14l',     name: 'Jumbo Bell 14L',      volume_l: 14,  volume_gal: 3.70 },
  { id: 'bucket_5gal',        name: '5 Gallon Bucket',     volume_l: 20,  volume_gal: 5.28 },
  { id: 'jerry_can_25l',      name: 'Jerry Can 25L',       volume_l: 25,  volume_gal: 6.60 },
  { id: 'drum_50l',           name: '50L Drum',            volume_l: 50,  volume_gal: 13.21 },
  { id: 'nipple_tank_100l',   name: 'Nipple Tank 100L',    volume_l: 100, volume_gal: 26.42 },
];
```

### 3.2 Medication seed (selected entries; full list in `db/seed/medications.ts`)

| id | name | category | delivery | dose/gal | unit | wd_meat | wd_eggs |
|---|---|---|---|---|---|---|---|
| `amprolium` | Amprolium (CORID) | coccidiostat | drinking_water | 1.5 | tsp | 1 | 0 |
| `oxytetracycline` | Oxytetracycline (Terramycin) | antibiotic | drinking_water | 1.5 | tsp | 7 | 7 |
| `tylosin` | Tylosin (Tylan) | antibiotic | drinking_water | 1 | tsp | 5 | 5 |
| `enrofloxacin` | Enrofloxacin (Baytril) | antibiotic | drinking_water | 1 | tsp | 14 | 14 |
| `fenbendazole` | Fenbendazole (Safe-Guard) | dewormer | drinking_water | 1 | tsp | 0 | 0 |
| `multivitamin` | Vitamins & Electrolytes | vitamin_electrolyte | drinking_water | 1 | tsp | 0 | 0 |
| `niacin` | Niacin (Duck) | supplement | drinking_water | 1.5 | tsp | 0 | 0 |
| `metronidazole` | Metronidazole (Turkey Blackhead) | antiprotozoal | drinking_water | 1 | tsp | 5 | — |
| `gumboro_intermediate` | Gumboro Intermediate | vaccine | drinking_water | 0 | ml | 0 | 0 |
| `lasota` | Lasota (Newcastle) | vaccine | drinking_water | 0 | ml | 0 | 0 |
| `duck_viral_hepatitis` | Duck Viral Hepatitis | vaccine | injection_subcutaneous | 0 | ml | 0 | 0 |
| `fowl_pox` | Fowl Pox | vaccine | injection_wing_web | 0 | ml | 0 | 0 |

Vaccine rows store `dose_per_bird_ml` and (for injections) `injection_site` instead of `dose_per_gallon`. `is_live_vaccine = true` for all live vaccines (drives C4 + C8).

### 3.3 Niacin auto-task (CONVENTIONS §2.9)

For every batch with `species = 'duck'`, `HealthTaskGenService.generateInitial`:

1. Schedules a `niacin` task **daily** Days 1–28 (delivery_method = `drinking_water`).
2. Then **weekly** from Week 5 until termination.
3. `dose_per_gallon = 1.5 tsp` from the medication row. Calculation per §3.5.

### 3.4 Injection vaccine UI (CONVENTIONS §2.12)

When `delivery_method ∈ {injection_subcutaneous, injection_wing_web}`:

- The "Complete Task" modal **hides** the container/water/dose fields.
- It shows: `injection_site`, `dose_per_bird_ml`, `bird_count`, total volume = `dose_per_bird_ml × bird_count`, plus the notice **"Manual administration — keep cold; remove water 2–3 h before."**
- Dose validation in §3.5 is skipped.

### 3.5 Dose calculation (CONVENTIONS §2.13)

```ts
// artifacts/api-server/src/modules/water-health/dosing.ts
export function computeDose(med: Medication, waterVolumeL: number) {
  if (med.delivery_method !== 'drinking_water') {
    return { amount: null, unit: null };
  }
  const amount = med.dose_per_gallon * (waterVolumeL / 3.785);
  return { amount, unit: med.dose_unit };
}
```

The legacy `(water_volume_l / 3.785) × 1.5` formula is **removed**. All medications now use their own `dose_per_gallon`.

### 3.6 water_records Table + Water Consumption Rates

The `water_records` table tracks daily water consumption log entries for batches.

#### Schema & Columns
- `id` (uuid, Primary Key)
- `batch_id` (uuid, references `batches(id)`)
- `farm_id` (uuid, references `farms(id)`)
- `date` (date, not null)
- `gallons_consumed` (real, not null)
- `temperature_c` (real)
- `notes` (text)
- `created_at` (timestamp with timezone, default now)

#### Water Consumption Rates per Species/Week (ml/bird/day)
- **Broiler:**
  - Week 1: 50 ml
  - Week 2: 100 ml
  - Week 3: 150 ml
  - Week 4: 200 ml
  - Week 5+: 250 ml
- **Layer:**
  - Weeks 1–2: 50 ml
  - Weeks 3–4: 100 ml
  - Weeks 5–8: 150 ml
  - Weeks 9–15: 200 ml
  - Weeks 16–18: 250 ml
  - Week 19+: 300 ml
- **Duck:**
  - Layer Week 20+: 500 ml
  - Other/All weeks:
    - Weeks 1–2: 150 ml
    - Weeks 3–4: 250 ml
    - Weeks 5–6: 350 ml
    - Weeks 7–8: 400 ml
    - Week 9+: 455 ml (or 450 ml per dosing-utils code)
- **Turkey:**
  - Weeks 1–2: 100 ml
  - Weeks 3–4: 150 ml
  - Weeks 5–6: 200 ml
  - Weeks 7–8: 300 ml
  - Weeks 9–10: 350 ml
  - Weeks 11–12: 400 ml
  - Weeks 13–14: 455 ml (or 450 ml per dosing-utils code)
  - Weeks 15–16: 500 ml
  - Week 17+: 550 ml

*Note: Duck and Turkey default fallbacks correspond to the final listed rates (e.g. 450 ml / 550 ml respectively).*

#### Heat Stress Multipliers
- Temperature < 20°C: 1.0×
- Temperature 20–25°C: 1.2×
- Temperature 25–30°C: 1.5×
- Temperature 30–35°C: 2.0×
- Temperature > 35°C: 2.5×

#### Prescribed Consumption Formula
`daily_water_gallons = (ml_per_bird × population × heat_multiplier) / 3785`

#### Heat Stress Alert
When `temperature_c > 32` °C, show electrolyte warning toast.

#### Financial Integration
Note: water logging does NOT create an expense record.

---

## 4. State Machine

Health tasks use a small status enum (no XState machine). Allowed transitions:

```
scheduled → pending      (when scheduled_date is today, set by daily job)
scheduled → blocked      (conflict matrix C1..C8)
pending   → completed    (POST /complete)
pending   → skipped      (POST /skip)
pending   → blocked      (a later task completion creates conflict)
```

`completed` and `skipped` are terminal. Re-evaluation of `blocked` occurs when the conflicting task is removed/skipped.

---

## 5. Public API

Mounted under `/api/v1/health` in `artifacts/api-server/src/modules/water-health/routes.ts`.

### 5.1 `GET /health/batches/:batchId/tasks`

```ts
export const ListTasksQuery = z.object({
  week: z.number().int().min(0).optional(),
  status: z.enum(['scheduled','pending','completed','skipped','blocked']).optional(),
});
export const ListTasksResponse = z.object({
  items: z.array(HealthTaskSchema),
  active_withdrawal_count: z.number().int(),
});
```

### 5.2 `POST /health/tasks` — create ad-hoc task

```ts
export const CreateTaskInput = z.object({
  id: z.string().uuid(),
  batch_id: z.string().uuid(),
  medication_id: z.string(),
  scheduled_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  window_days: z.number().int().min(1).max(30).default(1),
  // For drinking_water:
  container_type_id: z.string().nullable().optional(),
  container_count: z.number().int().positive().nullable().optional(),
  notes: z.string().max(500).nullable().optional(),
});
export const CreateTaskResponse = z.object({
  task: HealthTaskSchema,
  conflict_warnings: z.array(z.object({ code: z.string(), message: z.string() })),
});
```

The handler:

1. Loads `Medication` + batch.
2. Picks `delivery_method` from the medication row.
3. If `drinking_water`: requires `container_type_id` + `container_count`; computes `water_volume_l = container.volume_l * container_count` and `computed_dose_amount` via §3.5.
4. If injection: requires neither; sets `bird_count = batch.current_quantity`.
5. Runs the **Conflict Matrix** (§6).
6. Inserts the task and (transactionally) writes `HEALTH_TASK_CREATED` to outbox.

### 5.3 `POST /health/tasks/:id/complete`

```ts
export const CompleteTaskInput = z.object({
  cost_pesewas: z.number().int().nonnegative().nullable().optional(),
  completed_at: z.string().datetime().optional(),    // defaults to now
  actual_water_volume_l: z.number().positive().optional(), // if farmer used different volume
  notes: z.string().max(500).nullable().optional(),
});
export const CompleteTaskResponse = z.object({
  task: HealthTaskSchema,
  withdrawal_meat_until: z.string().nullable(),
  withdrawal_eggs_until: z.string().nullable(),
  triggered_batch_withdrawal: z.boolean(),
});
```

Sets `status = 'completed'`, `completed_at`, `withdrawal_meat_until = completed_at + medication.withdrawal_meat_days`, similarly for eggs. Publishes `HEALTH_TASK_COMPLETED`. If `withdrawal_meat_days > 0`, also publishes `BATCH_WITHDRAWAL_STARTED` (consumed by Batch FSM, see `02_BATCH_MANAGEMENT.md` §4.3).

### 5.4 `POST /health/tasks/:id/skip`

```ts
export const SkipTaskInput = z.object({ reason: z.string().min(1).max(500) });
```

### 5.5 `GET /health/medications`

```ts
export const ListMedicationsQuery = z.object({
  category: z.enum([
    'coccidiostat','antibiotic','dewormer','vitamin_electrolyte',
    'antifungal','antiprotozoal','vaccine','supplement',
  ]).optional(),
  delivery_method: z.enum([
    'drinking_water','injection_subcutaneous','injection_wing_web','in_feed','topical',
  ]).optional(),
});
export const ListMedicationsResponse = z.array(MedicationSchema);
```

### 5.6 `GET /health/containers`

Returns the 9 canonical container types (§3.1). No filters.

### 5.7 `GET /health/batches/:batchId/withdrawals`

```ts
export const WithdrawalSummary = z.object({
  has_active_meat_withdrawal: z.boolean(),
  has_active_eggs_withdrawal: z.boolean(),
  meat_clear_date: z.string().nullable(),
  eggs_clear_date: z.string().nullable(),
  active_tasks: z.array(HealthTaskSchema),
});
```

---

## 6. Conflict Matrix (CONVENTIONS §2.2)

Implemented in `artifacts/api-server/src/modules/water-health/conflicts.ts`. All 8 conflicts must be evaluated on every task create.

| Code | Detector |
|---|---|
| **C1** | New task med = coccidiostat (`amprolium`) AND any active/scheduled task in [today, +5d] is sulfa antibiotic (`is_sulfa = true`) → **BLOCK** |
| **C2** | New task med category = `antibiotic` AND any other antibiotic task overlaps the window → **BLOCK** |
| **C3** | New task med category = `dewormer` AND coccidiostat scheduled same day → **WARN** (allow) |
| **C4** | (live vaccine + antibiotic within **72 h**) — symmetric: new vaccine blocks if antibiotic completed/scheduled within ±72 h; new antibiotic blocks if live vaccine within ±72 h → **BLOCK** |
| **C5** | `enrofloxacin` and any antibiotic overlap → **BLOCK** |
| **C6** | `is_activated_charcoal` task and any oral medication within ±4 h → **BLOCK** |
| **C7** | `contains_calcium` task and `is_tetracycline` task within ±4 h → **BLOCK** |
| **C8** | `is_live_vaccine` task on a water source flagged `chlorinated = true` (per `farm.water_source.chlorinated`) → **BLOCK** |

```ts
// Pseudocode-free signature
export type ConflictCode = 'C1'|'C2'|'C3'|'C4'|'C5'|'C6'|'C7'|'C8';
export interface ConflictHit { code: ConflictCode; severity: 'BLOCK'|'WARN'; message: string; }
export function detectConflicts(args: {
  newTask: HealthTask; newMed: Medication;
  neighborhood: { task: HealthTask; med: Medication }[];
  waterSource: { chlorinated: boolean };
}): ConflictHit[];
```

If any `BLOCK` is returned the task is rejected with HTTP 422 `MEDICATION_CONFLICT` and the conflict codes in `error.details.conflicts`.

---

## 7. Events Published / Consumed

```ts
export interface HealthTaskCreatedEvent  { type: 'HEALTH_TASK_CREATED';  task_id: string; batch_id: string; farm_id: string; medication_id: string; occurred_at: string; }
export interface HealthTaskCompletedEvent {
  type: 'HEALTH_TASK_COMPLETED';
  task_id: string; batch_id: string; farm_id: string;
  medication_id: string;
  cost_pesewas: number | null;
  withdrawal_meat_until: string | null;
  withdrawal_eggs_until: string | null;
  occurred_at: string;
}
export interface BatchWithdrawalStartedEvent {
  type: 'BATCH_WITHDRAWAL_STARTED';
  batch_id: string; farm_id: string; clear_date: string; scope: 'meat'|'eggs';
  occurred_at: string;
}
export interface BatchWithdrawalClearedEvent {
  type: 'BATCH_WITHDRAWAL_CLEARED';
  batch_id: string; farm_id: string; scope: 'meat'|'eggs';
  occurred_at: string;
}
```

**Consumed:**

- `BATCH_CREATED` → generate Day-1 protocol (incl. duck niacin, broiler Day-7 Gumboro, etc.).
- `BATCH_WEEK_ADVANCED` → generate the new week's tasks per species protocol.
- `MORTALITY_RECORDED` → recompute `bird_count` on injection tasks scheduled in the future.

---

## 8. Background Jobs (pg-boss)

```ts
// artifacts/api-server/src/jobs/water-health-jobs.ts
import PgBoss from 'pg-boss';

export async function registerWaterHealthJobs(boss: PgBoss, farm: { id: string; timezone: string }) {
  // CONVENTIONS §2.11 — daily 06:00 farm timezone, per farm.
  await boss.schedule(
    `gen-daily-tasks-${farm.id}`,
    '0 6 * * *',
    { farmId: farm.id },
    { tz: farm.timezone },
  );
}

export async function registerWithdrawalSweepJob(boss: PgBoss) {
  // Withdrawal sweep — every 4 h UTC (data-only).
  await boss.schedule('withdrawal-sweep', '0 */4 * * *', {});
}

export async function dailyTasksHandler(job: PgBoss.Job<{ farmId: string }>) {
  return HealthTaskGenService.generateForFarm(job.data.farmId);
}

export async function withdrawalSweepHandler(_job: PgBoss.Job) {
  return WithdrawalService.sweepAndEmitClearEvents();
}
```

`WithdrawalService.sweepAndEmitClearEvents()` finds any batch where `MAX(withdrawal_meat_until) < today` AND `has_active_withdrawal = true`, sets `has_active_withdrawal = false`, and emits `BATCH_WITHDRAWAL_CLEARED` (which in turn triggers the batch FSM `CLEAR_WITHDRAWAL` event).

---

## 9. Business Rules & Invariants

1. **R-WH-1** Containers: exactly **9** canonical types (CONVENTIONS §2.3). No 10th.
2. **R-WH-2** Dose for `delivery_method = drinking_water` = `medication.dose_per_gallon × (water_volume_l / 3.785)` (CONVENTIONS §2.13).
3. **R-WH-3** For injection delivery methods, dose UI shows `dose_per_bird_ml × bird_count`; container fields are null (CONVENTIONS §2.12).
4. **R-WH-4** Conflict matrix C1–C8 evaluated on every create; any BLOCK rejects with HTTP 422 (CONVENTIONS §2.2).
5. **R-WH-5** Vaccine + antibiotic guard window is **72 h** (C4), not 48 h (CONVENTIONS §2.2).
6. **R-WH-6** Duck batches receive auto-niacin tasks: daily Days 1–28, then weekly until termination (CONVENTIONS §2.9).
7. **R-WH-7** Turkey batches receive auto-Metronidazole tasks every 2 weeks for blackhead prophylaxis (CONVENTIONS §2.10).
8. **R-WH-8** Completing a task with `withdrawal_meat_days > 0` flips `batches.has_active_withdrawal = true` and emits `BATCH_WITHDRAWAL_STARTED`.
9. **R-WH-9** Daily sweep clears withdrawals when `MAX(withdrawal_meat_until) < today`.
10. **R-WH-10** Live vaccine on a chlorinated water source is rejected (C8).
11. **R-WH-11** Every farm-scoped query includes `farm_id`.
12. **R-WH-12** All write endpoints accept `Idempotency-Key`.
13. **R-WH-13** `cost_pesewas` is integer pesewas (CONVENTIONS §4.2); display layer formats per `farm.currency`.
14. **R-WH-14** Daily generation runs at 06:00 in `farm.timezone` (CONVENTIONS §2.11).

---

## 10. Error Codes

| Code | HTTP | Meaning |
|---|---|---|
| `MEDICATION_CONFLICT` | 422 | One or more BLOCK conflicts (C1–C8); see `details.conflicts` |
| `INVALID_CONTAINER` | 422 | `container_type_id` not one of the 9 canonical |
| `INVALID_DELIVERY_METHOD_INPUT` | 422 | Container fields supplied for an injection (or vice versa) |
| `WITHDRAWAL_ACTIVE` | 409 | Bubbled to batch terminate (see `02_BATCH_MANAGEMENT.md`) |
| `MEDICATION_NOT_FOUND` | 404 | Unknown `medication_id` |
| `TASK_TERMINAL` | 409 | Cannot mutate completed/skipped task |

---

## 11. Observability

Log fields: `task_id`, `batch_id`, `farm_id`, `medication_id`, `delivery_method`, `status`, `conflict_codes`. Metrics:

- `health_tasks_generated_total{farm_id, species}` — counter.
- `health_tasks_completed_total{farm_id}` — counter.
- `health_task_conflicts_total{farm_id, code}` — counter (C1..C8).
- `withdrawals_active_total{farm_id, scope}` — gauge.

---

## 12. Test Plan

Vitest + supertest. One case per business rule:

1. Create with 9 valid container ids — all accepted; a 10th value (e.g. `drum_200l`) returns `INVALID_CONTAINER` (R-WH-1).
2. Dose: `amprolium` (1.5 tsp/gal) at 25 L water → `1.5 × (25/3.785) ≈ 9.9` tsp (R-WH-2).
3. Injection task for `duck_viral_hepatitis`: container fields null, `dose_per_bird_ml × bird_count` shown (R-WH-3).
4. C1: amprolium scheduled, then sulfa antibiotic create → BLOCK (R-WH-4).
5. C2: two antibiotic tasks overlap → BLOCK.
6. C3: dewormer + coccidiostat same day → WARN.
7. C4: live vaccine completed yesterday, antibiotic created today → BLOCK; antibiotic at +73 h passes (R-WH-5).
8. C5: enrofloxacin + tylosin overlap → BLOCK.
9. C6: charcoal task and oral med within 4 h → BLOCK.
10. C7: calcium + tetracycline within 4 h → BLOCK.
11. C8: live vaccine on chlorinated source → BLOCK (R-WH-10).
12. Duck batch creation seeds niacin tasks daily Days 1–28 then weekly (R-WH-6).
13. Turkey batch seeds Metronidazole every 2 weeks (R-WH-7).
14. Completing oxytetracycline (7-day withdrawal) flips `has_active_withdrawal = true` (R-WH-8).
15. After 8 days, sweep clears withdrawal and emits `BATCH_WITHDRAWAL_CLEARED` (R-WH-9).
16. Idempotent create: same `Idempotency-Key` returns same task (R-WH-12).
17. Cross-farm read on task returns 404 (R-WH-11).

---

## 13. Open Questions

1. Per-farm chlorinated water flag location — `farms.water_source_chlorinated` boolean vs full `water_sources` table? Currently boolean; revisit if farms have multiple sources.
2. Turkey blackhead protocol cadence (every 2 weeks vs every 3 weeks) — pending vet sign-off; default = every 2 weeks.
3. Duck niacin tapering past Week 12 — current spec keeps weekly; some references suggest every 2 weeks after Week 12.

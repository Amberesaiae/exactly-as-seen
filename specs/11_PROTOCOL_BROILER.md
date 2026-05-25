# Broiler Protocol

**Status:** Spec v2 (rewritten)
**Species code:** `broiler`
**Lifecycle:** 6 weeks rearing + sale window Day 42–49 (configurable 42–56 days)
**Traditional remedies:** **NO.** Commercial meat-bird production with short cycle and strict meat-withdrawal compliance. Slow-acting herbal remedies are incompatible with the 6-week window and consumer food-safety expectations.

This spec is the canonical species protocol for `species = 'broiler'`. It seeds the `species_config` table consumed by the daily task generator (`generateDailyBatchTasks`, see `04_WATER_HEALTH.md` §7) and the Batch Creation Wizard (`02_BATCH_MANAGEMENT.md` §4). All doses follow the dose-derivation rule in `00_CONVENTIONS.md` §2.13.

---

## 1. Overview

Broilers are reared in a 6-week intensive cycle followed by a 4-day plain-water withdrawal buffer (Day 39–42) and a sale window from Day 42 to Day 49. The protocol below covers:

- 6 distinct weekly medication blocks
- **5 vaccinations** (per `00_CONVENTIONS.md` §2.8) — all delivered via `drinking_water`
- 1 deworming event (Day 36, Fenbendazole, 0-day withdrawal)
- A mandatory withdrawal phase Day 39–42 in which **only plain water** is permitted

Cross-refs:
- Batch FSM and phase thresholds — `02_BATCH_MANAGEMENT.md` §4
- Task generation, dosing rule, conflict matrix — `04_WATER_HEALTH.md`
- Withdrawal enforcement — `04_WATER_HEALTH.md` §8 + `02_BATCH_MANAGEMENT.md` §4 (FSM `withdrawal` state)

---

## 2. Water Consumption Table

| Week | Day range | Per bird (ml/day) | 100 birds (L) | 500 birds (L) | Phase |
|---|---|---|---|---|---|
| 1 | 1–7   | 50  | 5  | 25  | brooding (starter) |
| 2 | 8–14  | 100 | 10 | 50  | starter |
| 3 | 15–21 | 150 | 15 | 75  | grower |
| 4 | 22–28 | 200 | 20 | 100 | grower |
| 5 | 29–35 | 250 | 25 | 125 | finisher |
| 6 | 36–42 | 250 | 25 | 125 | finisher → withdrawal |

On vaccination days the **medicated water volume is half the daily ration** (birds are made thirsty 2–3 h before; vaccine consumed within 1 h). The remaining half is given plain after the dose.

---

## 3. Disease Profile

| Threat | Rank | Default prevention in this protocol |
|---|---|---|
| Coccidiosis (Eimeria spp.) | #1 | Amprolium pulses Wk 1, 2, 3, 5 |
| Infectious Bursal Disease (Gumboro) | #2 | 3 Gumboro vaccinations (Day 7, 21, 35) |
| Newcastle Disease | #3 | HB1 (Day 14) + Lasota (Day 28) |
| Worms (Ascaridia, Heterakis) | #4 | Fenbendazole Day 36 |
| Heat stress | Endemic (West Africa) | Electrolytes on demand (emergency) |

---

## 4. Medication Schedule (week-by-week)

All daily water volumes are for **100 birds**. Doses are computed per `00_CONVENTIONS.md` §2.13 from each medication's `dose_per_gallon` and `unit`. The "Computed dose" column shows the value the task generator must produce (`dose_per_gallon × water_L / 3.785`, rounded to 1 decimal).

### Week 1 — Days 1–7 (brooding)

| Day | Medication | Daily water (L) | dose_per_gal | Computed dose | Delivery |
|---|---|---|---|---|---|
| 1–3 | `anti_stress_glucose` | 5  | 1.5 tbsp | 2.0 tbsp     | drinking_water |
| 4–6 | `amprolium`           | 5  | 1.0 tsp  | 1.3 tsp      | drinking_water |
| 7   | **VAX `gumboro_intermediate`** | 2.5 (½ ration) | n/a (one vial / 1000 birds) | per vial label | drinking_water |

### Week 2 — Days 8–14 (starter)

| Day | Medication | Daily water (L) | dose_per_gal | Computed dose | Delivery |
|---|---|---|---|---|---|
| 8–10  | `multivitamin`     | 10 | 1.0 tbsp | 2.6 tbsp | drinking_water |
| 11–13 | `amprolium`        | 10 | 1.0 tsp  | 2.6 tsp  | drinking_water |
| 14    | **VAX `hb1_newcastle_ib`** | 5 (½) | per label | per vial | drinking_water |

### Week 3 — Days 15–21 (grower)

| Day | Medication | Daily water (L) | dose_per_gal | Computed dose | Delivery |
|---|---|---|---|---|---|
| 15, 17, 19 | `amprolium`         | 15 | 1.0 tsp | 4.0 tsp | drinking_water |
| 16, 18, 20 | (plain water — rest) | 15 | —       | —       | — |
| 21         | **VAX `gumboro_plus`** | 7.5 (½) | per label | per vial | drinking_water |

### Week 4 — Days 22–28 (grower)

| Day | Medication | Daily water (L) | dose_per_gal | Computed dose | Delivery |
|---|---|---|---|---|---|
| 22–24 | `anti_stress_glucose` | 20 | 1.5 tbsp | 7.9 tbsp | drinking_water |
| 25–27 | `multivitamin`        | 20 | 1.0 tbsp | 5.3 tbsp | drinking_water |
| 28    | **VAX `lasota`**      | 10 (½) | per label | per vial | drinking_water |

### Week 5 — Days 29–35 (finisher)

| Day | Medication | Daily water (L) | dose_per_gal | Computed dose | Delivery |
|---|---|---|---|---|---|
| 29–30 | `multivitamin` | 25 | 1.0 tbsp | 6.6 tbsp | drinking_water |
| 31, 33 | `amprolium`   | 25 | 1.0 tsp  | 6.6 tsp  | drinking_water |
| 32, 34 | (plain water) | 25 | —        | —        | — |
| 35    | **VAX `gumboro_plus`** | 12.5 (½) | per label | per vial | drinking_water |

### Week 6 — Days 36–42 (deworm + withdrawal)

| Day | Medication | Daily water (L) | dose_per_gal | Computed dose | Delivery |
|---|---|---|---|---|---|
| 36    | `fenbendazole` (single dose) | 25 | per label | per label | drinking_water |
| 37–38 | `multivitamin`               | 25 | 1.0 tbsp | 6.6 tbsp  | drinking_water |
| **39–42** | **PLAIN WATER ONLY — withdrawal phase** | 25 | — | — | — |

**Rule B-1 (withdrawal buffer).** Days 39–42 are immutable: the FSM `withdrawal` state blocks any non-vitamin/non-electrolyte task. The 4-day buffer guarantees Amprolium (≤24 h withdrawal), multivitamins (0 d), and fenbendazole (0 d) are all clear before Day 42. Sale window is Day 42–49.

---

## 5. Vaccination Schedule Summary

Per `00_CONVENTIONS.md` §2.8 the broiler protocol has **exactly 5 vaccinations** — all `drinking_water` delivery, half the daily water ration, one event per day.

| # | Day | Vaccine code | Common name | Targets |
|---|---|---|---|---|
| 1 | 7  | `gumboro_intermediate`      | Gumboro Intermediate       | IBD priming |
| 2 | 14 | `hb1_newcastle_ib`          | HB1                        | Newcastle + Infectious Bronchitis |
| 3 | 21 | `gumboro_plus`              | Gumboro Intermediate Plus  | IBD booster |
| 4 | 28 | `lasota`                    | Lasota                     | Newcastle booster |
| 5 | 35 | `gumboro_plus`              | Gumboro Intermediate Plus  | Final IBD booster |

Administration steps (every event):
1. Buy vaccine same morning, transport on ice.
2. Withhold water 2–3 h prior.
3. Mix into ½ daily water ration; consume within 1 h.
4. Auto-schedule `anti_stress_glucose` for the next 2 days (post-vaccine support).

Conflicts triggered by these tasks (see `04_WATER_HEALTH.md` §5 / `00_CONVENTIONS.md` §2.2): C4 (live vaccine + antibiotic within 72 h) and C8 (live vaccine + chlorinated water).

---

## 6. Withdrawal Periods

### 6.1 Routine medications used in this protocol

| Medication code | Meat withdrawal | Last safe day (if used Day X) | Notes |
|---|---|---|---|
| `amprolium`           | 0–24 h | Day 41 | Tracked as 1 day for safety |
| `multivitamin`        | 0 d    | n/a | Always safe |
| `anti_stress_glucose` | 0 d    | n/a | Always safe |
| `electrolytes`        | 0 d    | n/a | Always safe |
| `fenbendazole`        | 0 d    | n/a | Day-36 deworm clears immediately |

Vaccines have no meat withdrawal but trigger the 72-h antibiotic-conflict guard (C4).

### 6.2 If antibiotics are required (emergency only)

| Antibiotic code | Withdrawal | If given Day 30 → safe sale | Notes |
|---|---|---|---|
| `oxytetracycline` | 7 d  | Day 37 | Pushes sale window |
| `tylosin`         | 5 d  | Day 35 | |
| `enrofloxacin`    | 14 d | Day 44 | Triggers C5 (no co-antibiotic) |

**Rule B-2.** Any task whose `last_safe_day + withdrawal_days > sale_target_day` must (a) be confirmed by the user and (b) update `batch.expected_sale_date`.

---

## 7. Emergency Protocols

### 7.1 Coccidiosis outbreak
- Signs: bloody droppings, huddling, drop in feed intake.
- Treatment: `amprolium` 2 tbsp/gal × 5 days, then `multivitamin` × 2 days.
- Withdrawal: 24 h after last dose.

### 7.2 Respiratory infection (Mycoplasma / E. coli secondary)
- Signs: sneezing, gasping, nasal discharge.
- Treatment (vet-confirmed): `tylosin` 1 tsp/gal × 5 days. Triggers C2 if any other antibiotic is active.
- Withdrawal: 5 d.

### 7.3 Heat stress
- Signs: panting, wings spread, reduced activity.
- Treatment: `electrolytes` 0.75 tsp/gal until temperature drops; double water availability.
- Withdrawal: 0 d.

All emergency tasks use the same dose-derivation rule (§2.13).

---

## 8. Cost Estimate (100 birds, 6 weeks, GHS)

| Category | Quantity | Estimated cost (GHS) |
|---|---|---|
| Coccidiostat (`amprolium`) | ~200 g | 50–70 |
| Multivitamins | ~150 g | 30–45 |
| Anti-stress + glucose | ~100 g | 25–35 |
| Vaccines × 5 | 5 vials | 60–80 |
| Dewormer (`fenbendazole`) | 1 dose | 20–30 |
| **Total** |  | **185–260** |

**Per-bird cost:** GHS 1.85–2.60. Cost is denominated in `pesewas` per `00_CONVENTIONS.md` §4.2 and shown in the farm currency (`GHS` default, `NGN` permitted) per §4.3.

---

## 9. App Task Display Examples

Wireframe alignment with `01_MASTER_ARCHITECTURE.md` and `02_BATCH_MANAGEMENT.md` §4 (Step 3 wizard summary).

### 9.1 Wizard Step 3 — Review (corrected)

```
┌─────────────────────────────────────────────┐
│ REVIEW — Broiler batch, 500 birds           │
├─────────────────────────────────────────────┤
│ Lifecycle:        6 weeks (Day 42 sale)     │
│ Phases:           brooding → starter →      │
│                   grower → finisher →       │
│                   withdrawal → ready_to_sell│
│ Vaccinations:     5 scheduled               │
│   Day 7  Gumboro Intermediate               │
│   Day 14 HB1 (Newcastle + IB)               │
│   Day 21 Gumboro Intermediate Plus          │
│   Day 28 Lasota                             │
│   Day 35 Gumboro Intermediate Plus          │
│ Deworming:        1 scheduled (Day 36)      │
│ Withdrawal:       Day 39–42 (plain water)   │
│ Sale window:      Day 42–49                 │
│                                             │
│ [Back]   [Confirm & Create Batch]           │
└─────────────────────────────────────────────┘
```

### 9.2 Daily task list — Week 4, House A, 500 broilers

```
┌─────────────────────────────────────────────┐
│ WEEK 4 TASKS — House A (500 broilers)       │
├─────────────────────────────────────────────┤
│ □ Anti-stress + Glucose (Days 22–24)        │
│   Daily water: 100 L  ≈ 26.4 gal            │
│   Dose: 39.6 tbsp  (1.5 tbsp/gal × 26.4)    │
│   Container: 5 × Jerry Can 25L              │
│                                             │
│ □ Multivitamin (Days 25–27)                 │
│   Daily water: 100 L                        │
│   Dose: 26.4 tbsp                           │
│                                             │
│ □ Lasota Vaccination (Day 28)               │
│   Method: drinking_water (½ ration = 50 L)  │
│   1 vial / 1000 birds — keep on ice         │
│   Auto-scheduled: anti-stress Days 29–30    │
└─────────────────────────────────────────────┘
```

All doses above are derived from `dose_per_gallon × (water_L / 3.785)` per §2.13.

---

## 10. Configuration JSON

The species protocol is stored in the `species_config` table (one row per species). Drizzle schema (lives in `lib/db/src/schema/species-config.ts`):

```ts
import { pgTable, text, integer, jsonb, timestamp } from 'drizzle-orm/pg-core';

export const speciesConfig = pgTable('species_config', {
  id: text('id').primaryKey(),                        // UUIDv7
  species: text('species').notNull().unique(),        // 'broiler' | 'layer' | ...
  schemaVersion: integer('schema_version').notNull(), // bump on breaking change
  config: jsonb('config').notNull(),                  // SpeciesProtocol JSON
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});
```

Zod schema for the `config` payload (lives in `artifacts/api-server/src/modules/batch/species-protocol.schema.ts`):

```ts
import { z } from 'zod';

export const DoseUnit = z.enum(['tsp', 'tbsp', 'ml', 'g']);

export const MedicationDose = z.object({
  medication_code: z.string(),
  dose_per_gallon: z.number().positive(),
  unit: DoseUnit,
  delivery_method: z.enum([
    'drinking_water', 'injection_subcutaneous',
    'injection_wing_web', 'in_feed', 'topical',
  ]),
  withdrawal_days_meat: z.number().int().nonnegative(),
  withdrawal_days_eggs: z.number().int().nonnegative().optional(),
});

export const ScheduledTask = z.object({
  day: z.number().int().positive(),       // 1-indexed day in batch
  task_type: z.enum(['medication', 'vaccination', 'deworming', 'plain_water']),
  medication_code: z.string().optional(),
  vaccine_code: z.string().optional(),
  water_fraction: z.number().min(0).max(1).default(1), // 0.5 for vaccines
  notes: z.string().optional(),
});

export const Phase = z.object({
  code: z.enum([
    'brooding', 'starter', 'grower', 'finisher',
    'withdrawal', 'ready_to_sell', 'lay', 'pre_lay',
  ]),
  start_day: z.number().int().positive(),
  end_day: z.number().int().positive(),
  per_bird_water_ml: z.number().int().positive(),
});

export const SpeciesProtocol = z.object({
  species: z.literal('broiler'),
  schema_version: z.literal(1),
  lifecycle_days_min: z.number().int(),
  lifecycle_days_max: z.number().int(),
  sale_window: z.object({ start_day: z.number().int(), end_day: z.number().int() }),
  traditional_remedies: z.literal(false),
  phases: z.array(Phase),
  medications: z.array(MedicationDose),
  schedule: z.array(ScheduledTask),
});

export type SpeciesProtocolT = z.infer<typeof SpeciesProtocol>;
```

Complete seed value for `species = 'broiler'` (insert via `scripts/src/seed-species-config.ts`):

```json
{
  "species": "broiler",
  "schema_version": 1,
  "lifecycle_days_min": 42,
  "lifecycle_days_max": 49,
  "sale_window": { "start_day": 42, "end_day": 49 },
  "traditional_remedies": false,
  "phases": [
    { "code": "brooding",      "start_day": 1,  "end_day": 7,  "per_bird_water_ml": 50  },
    { "code": "starter",       "start_day": 8,  "end_day": 14, "per_bird_water_ml": 100 },
    { "code": "grower",        "start_day": 15, "end_day": 28, "per_bird_water_ml": 175 },
    { "code": "finisher",      "start_day": 29, "end_day": 38, "per_bird_water_ml": 250 },
    { "code": "withdrawal",    "start_day": 39, "end_day": 42, "per_bird_water_ml": 250 },
    { "code": "ready_to_sell", "start_day": 42, "end_day": 49, "per_bird_water_ml": 250 }
  ],
  "medications": [
    { "medication_code": "anti_stress_glucose", "dose_per_gallon": 1.5, "unit": "tbsp", "delivery_method": "drinking_water", "withdrawal_days_meat": 0 },
    { "medication_code": "multivitamin",        "dose_per_gallon": 1.0, "unit": "tbsp", "delivery_method": "drinking_water", "withdrawal_days_meat": 0 },
    { "medication_code": "amprolium",           "dose_per_gallon": 1.0, "unit": "tsp",  "delivery_method": "drinking_water", "withdrawal_days_meat": 1 },
    { "medication_code": "fenbendazole",        "dose_per_gallon": 1.0, "unit": "ml",   "delivery_method": "drinking_water", "withdrawal_days_meat": 0 },
    { "medication_code": "electrolytes",        "dose_per_gallon": 0.75,"unit": "tsp",  "delivery_method": "drinking_water", "withdrawal_days_meat": 0 }
  ],
  "schedule": [
    { "day": 1,  "task_type": "medication",  "medication_code": "anti_stress_glucose" },
    { "day": 2,  "task_type": "medication",  "medication_code": "anti_stress_glucose" },
    { "day": 3,  "task_type": "medication",  "medication_code": "anti_stress_glucose" },
    { "day": 4,  "task_type": "medication",  "medication_code": "amprolium" },
    { "day": 5,  "task_type": "medication",  "medication_code": "amprolium" },
    { "day": 6,  "task_type": "medication",  "medication_code": "amprolium" },
    { "day": 7,  "task_type": "vaccination", "vaccine_code": "gumboro_intermediate", "water_fraction": 0.5 },
    { "day": 8,  "task_type": "medication",  "medication_code": "multivitamin" },
    { "day": 9,  "task_type": "medication",  "medication_code": "multivitamin" },
    { "day": 10, "task_type": "medication",  "medication_code": "multivitamin" },
    { "day": 11, "task_type": "medication",  "medication_code": "amprolium" },
    { "day": 12, "task_type": "medication",  "medication_code": "amprolium" },
    { "day": 13, "task_type": "medication",  "medication_code": "amprolium" },
    { "day": 14, "task_type": "vaccination", "vaccine_code": "hb1_newcastle_ib", "water_fraction": 0.5 },
    { "day": 15, "task_type": "medication",  "medication_code": "amprolium" },
    { "day": 17, "task_type": "medication",  "medication_code": "amprolium" },
    { "day": 19, "task_type": "medication",  "medication_code": "amprolium" },
    { "day": 21, "task_type": "vaccination", "vaccine_code": "gumboro_plus", "water_fraction": 0.5 },
    { "day": 22, "task_type": "medication",  "medication_code": "anti_stress_glucose" },
    { "day": 23, "task_type": "medication",  "medication_code": "anti_stress_glucose" },
    { "day": 24, "task_type": "medication",  "medication_code": "anti_stress_glucose" },
    { "day": 25, "task_type": "medication",  "medication_code": "multivitamin" },
    { "day": 26, "task_type": "medication",  "medication_code": "multivitamin" },
    { "day": 27, "task_type": "medication",  "medication_code": "multivitamin" },
    { "day": 28, "task_type": "vaccination", "vaccine_code": "lasota", "water_fraction": 0.5 },
    { "day": 29, "task_type": "medication",  "medication_code": "multivitamin" },
    { "day": 30, "task_type": "medication",  "medication_code": "multivitamin" },
    { "day": 31, "task_type": "medication",  "medication_code": "amprolium" },
    { "day": 33, "task_type": "medication",  "medication_code": "amprolium" },
    { "day": 35, "task_type": "vaccination", "vaccine_code": "gumboro_plus", "water_fraction": 0.5 },
    { "day": 36, "task_type": "deworming",   "medication_code": "fenbendazole" },
    { "day": 37, "task_type": "medication",  "medication_code": "multivitamin" },
    { "day": 38, "task_type": "medication",  "medication_code": "multivitamin" },
    { "day": 39, "task_type": "plain_water", "notes": "Withdrawal phase begins" },
    { "day": 40, "task_type": "plain_water" },
    { "day": 41, "task_type": "plain_water" },
    { "day": 42, "task_type": "plain_water", "notes": "Sale window opens" }
  ]
}
```

The task generator (`04_WATER_HEALTH.md` §7) materialises each schedule entry into a `health_tasks` row with:

```ts
dose_amount = dose_per_gallon * (per_bird_water_ml * birds * water_fraction / 1000 / 3.785)
```

---

## 11. Notes & References

- **No traditional remedies.** Commercial broiler production excludes herbal protocols.
- **5 vaccinations enumerated** in §5 — fixes the validation report finding H5.
- **Withdrawal Day 39–42** is a hard FSM-enforced phase (`02_BATCH_MANAGEMENT.md` §4); no medication tasks may be created in this window.
- **Dose derivation** follows `00_CONVENTIONS.md` §2.13 exactly. The legacy formula `(water_L / 3.785) × 1.5` is retired.
- **Conflict matrix** that applies during this protocol: C1 (Amprolium + sulfa BLOCK), C4 (live vaccine + antibiotic 72 h), C8 (live vaccine + chlorinated water). See `00_CONVENTIONS.md` §2.2 and `04_WATER_HEALTH.md` §5.
- Original source preserved at `attached_assets/BROILER_1777797788376.md`.

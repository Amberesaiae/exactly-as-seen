# Layer Protocol

**Status:** Spec v2 (rewritten)
**Species code:** `layer`
**Lifecycle:** 72–78 weeks (canonical default termination = 78 weeks, per `00_CONVENTIONS.md` §2.4)
**Production phase:** **Week 19+** (per `00_CONVENTIONS.md` §2.1 — corrects all earlier references to Week 17)
**Traditional remedies:** **NO.** Eggs are consumed daily; egg-withdrawal compliance and shell-quality consistency require pharmaceutical protocols only.

This spec is the canonical species protocol for `species = 'layer'`. It seeds the `species_config` table consumed by the daily task generator (`generateDailyBatchTasks`, see `04_WATER_HEALTH.md` §7) and the Batch Creation Wizard (`02_BATCH_MANAGEMENT.md` §4). All doses follow the dose-derivation rule in `00_CONVENTIONS.md` §2.13.

---

## 1. Overview

Layer rearing is an 18-week build-up to lay, followed by a long production phase from **Week 19** until termination at Week 72–78. The protocol covers:

- **Rearing (Week 1–18):** brooding → starter → grower → developer → pre-lay; **11 vaccination events**, 2 dewormings.
- **Production (Week 19+):** monthly deworm + vitamin rotation; **quarterly Newcastle boosters**; calcium support continuous (in feed; see `06_FEED_CALCULATOR.md`).
- Two distinct withdrawal categories: **egg withdrawal** and **meat withdrawal** (cull at end of cycle).

Cross-refs:
- Egg production tracking begins Week 19 — see `05_EGG_PRODUCTION.md`.
- Batch FSM phase thresholds — `02_BATCH_MANAGEMENT.md` §4 (FSM gains a `lay` state distinct from `ready_to_sell`).
- Conflict matrix and dose derivation — `04_WATER_HEALTH.md` and `00_CONVENTIONS.md` §2.2 + §2.13.

---

## 2. Water Consumption Table

| Week range | Per bird (ml/day) | 100 birds (L) | 500 birds (L) | Phase |
|---|---|---|---|---|
| 1–2   | 50  | 5   | 25  | brooding (starter) |
| 3–4   | 100 | 10  | 50  | starter |
| 5–8   | 150 | 15  | 75  | grower |
| 9–15  | 200 | 20  | 100 | developer |
| 16–18 | 250 | 25  | 125 | pre-lay |
| **19+** | **300** | **30** | **150** | **production (lay)** |

Layers consume more water during lay because eggs are ~75 % water. On vaccination days delivered via drinking water the medicated portion is **half the daily ration**.

---

## 3. Disease Profile

| Threat | Rank | Default prevention in this protocol |
|---|---|---|
| Newcastle Disease | #1 | HB1, 2× Lasota, 3rd Newcastle pre-lay, then quarterly boosters Week 19+ |
| Infectious Bursal Disease (Gumboro) | #2 | 3 Gumboro vaccinations Week 1–5 |
| Fowl Pox | #3 | 2× wing-web Fowl Pox (Day 56, Day 84) |
| Worms (Ascaridia, Heterakis, Capillaria) | Endemic | Dewormings Day 49, Day 91, then **monthly** Week 19+ |
| Coccidiosis | Recurring | Amprolium pulses through rearing; as-needed in production |
| Egg Drop Syndrome / IB | Production-phase | 3rd Newcastle pre-lay + quarterly boosters |
| Calcium deficiency / soft shells | Production-phase | Calcium in feed + weekly D3 (production) |

---

## 4. Medication Schedule (week-by-week)

Doses below are computed via `dose_per_gallon × (water_L / 3.785)` (`00_CONVENTIONS.md` §2.13), shown for **100 birds**.

### 4.1 Rearing — Weeks 1–6 (mirrors broiler protocol; `11_PROTOCOL_BROILER.md` §4)

| Week | Day(s) | Medication / Vaccine | Daily water (L) | dose_per_gal | Computed dose | Delivery |
|---|---|---|---|---|---|---|
| 1 | 1     | **VAX `mareks_hvt`** (hatchery) | n/a | n/a | per dose vial | injection_subcutaneous |
| 1 | 1–3   | `anti_stress_glucose` | 5  | 1.5 tbsp | 2.0 tbsp | drinking_water |
| 1 | 4–6   | `amprolium`           | 5  | 1.0 tsp  | 1.3 tsp  | drinking_water |
| 1 | 7     | **VAX `gumboro_intermediate`** | 2.5 (½) | per label | per vial | drinking_water |
| 2 | 8–10  | `multivitamin`        | 10 | 1.0 tbsp | 2.6 tbsp | drinking_water |
| 2 | 11–13 | `amprolium`           | 10 | 1.0 tsp  | 2.6 tsp  | drinking_water |
| 2 | 14    | **VAX `hb1_newcastle_ib`** | 5 (½) | per label | per vial | drinking_water |
| 3 | 15,17,19 | `amprolium`        | 15 | 1.0 tsp  | 4.0 tsp  | drinking_water |
| 3 | 21    | **VAX `gumboro_plus`** | 7.5 (½) | per label | per vial | drinking_water |
| 4 | 22–24 | `anti_stress_glucose` | 20 | 1.5 tbsp | 7.9 tbsp | drinking_water |
| 4 | 28    | **VAX `lasota`**      | 10 (½) | per label | per vial | drinking_water |
| 5 | 29–30 | `multivitamin`        | 25 | 1.0 tbsp | 6.6 tbsp | drinking_water |
| 5 | 31,33 | `amprolium`           | 25 | 1.0 tsp  | 6.6 tsp  | drinking_water |
| 5 | 35    | **VAX `gumboro_plus`** | 12.5 (½) | per label | per vial | drinking_water |
| 6 | 36–42 | alternating cocci/vit (M-W-F amprolium, T-Th multivitamin, weekend plain) | 25 | as above | as above | drinking_water |

### 4.2 Rearing — Weeks 7–8 (deworming + 1st Fowl Pox)

| Week | Day | Medication / Vaccine | Daily water (L) | Dose | Delivery |
|---|---|---|---|---|---|
| 7 | 43–45 | `anti_stress_glucose`            | 25 | 9.9 tbsp | drinking_water |
| 7 | 49    | **DEWORM `fenbendazole`**        | 25 | per label | drinking_water |
| 7 | 50–51 | `multivitamin`                   | 25 | 6.6 tbsp | drinking_water |
| 8 | 56    | **VAX `fowl_pox_1`**             | n/a | 0.01 ml/bird | injection_wing_web |
| 8 | 57–58 | `multivitamin`                   | 25 | 6.6 tbsp | drinking_water |

### 4.3 Rearing — Weeks 9–12

| Week | Day | Medication / Vaccine | Daily water (L) | Dose | Delivery |
|---|---|---|---|---|---|
| 9–10  | Mon/Wed/Fri | `amprolium`         | 20 | 5.3 tsp | drinking_water |
| 10    | 70          | **VAX `lasota`**    | 10 (½) | per vial | drinking_water |
| 11–12 | Mon/Wed/Fri | `amprolium`         | 20 | 5.3 tsp | drinking_water |
| 12    | 84          | **VAX `fowl_pox_2`**| n/a | 0.01 ml/bird | injection_wing_web |

### 4.4 Rearing — Weeks 13–18 (pre-lay)

| Week | Day | Medication / Vaccine | Daily water (L) | Dose | Delivery |
|---|---|---|---|---|---|
| 13 | 85–87 | `anti_stress_glucose`            | 20 | 7.9 tbsp | drinking_water |
| 13 | 91    | **DEWORM `fenbendazole`**        | 20 | per label | drinking_water |
| 14–15 | daily | `calcium_supplement`           | n/a | per feed-formulation | in_feed |
| 16 | 112   | **VAX `lasota` (3rd Newcastle)** | 12.5 (½) | per vial | drinking_water |
| 17 | 119   | **VAX `nd_ib_killed`** (pre-lay) | n/a | 0.5 ml/bird | injection_subcutaneous |
| 18 | 120+  | `multivitamin` weekly + `electrolytes` as needed | 25 | as above | drinking_water |

### 4.5 Production — Week 19+ (monthly cycle)

Production-phase task generator emits a **rolling 4-week monthly cycle** anchored to the start of Week 19:

| Week of cycle | Medication | Daily water (L, 100 birds) | Dose | Delivery |
|---|---|---|---|---|
| 1 (e.g. Wk 19, 23, 27, …) | `fenbendazole` (single-day deworm) | 30 | per label | drinking_water |
| 1 (next 2 days)           | `multivitamin` (post-deworm)        | 30 | 7.9 tbsp | drinking_water |
| 2 | plain water (rest)                                   | 30 | — | — |
| 3 | `amprolium` (only if cocci risk flagged by audit)    | 30 | 7.9 tsp | drinking_water |
| 4 | `multivitamin` + weekly `vitamin_d3`                 | 30 | 7.9 tbsp | drinking_water |

**Quarterly Newcastle boosters (Rule L-3).** From Week 19 the scheduler emits a `lasota` (or `nd_inactivated` injectable) booster every **13 weeks** (Weeks 19, 32, 45, 58, 71). Generator code: `if (week >= 19 && (week - 19) % 13 === 0) emitBooster()`.

`calcium_supplement` and shell-quality vitamins are continuous in feed; see `06_FEED_CALCULATOR.md` for the Layer feed phases.

---

## 5. Vaccination Schedule Summary

### 5.1 Rearing phase — **11 vaccination events** (Week 1–18)

| # | Day | Week | Vaccine code | Common name | Delivery | Targets |
|---|---|---|---|---|---|---|
| 1  | 1   | 1  | `mareks_hvt`            | Marek's HVT                | injection_subcutaneous | Marek's (hatchery) |
| 2  | 7   | 1  | `gumboro_intermediate`  | Gumboro Intermediate       | drinking_water         | IBD priming |
| 3  | 14  | 2  | `hb1_newcastle_ib`      | HB1                        | drinking_water         | Newcastle + IB |
| 4  | 21  | 3  | `gumboro_plus`          | Gumboro Intermediate Plus  | drinking_water         | IBD booster |
| 5  | 28  | 4  | `lasota`                | Lasota                     | drinking_water         | Newcastle |
| 6  | 35  | 5  | `gumboro_plus`          | Gumboro Intermediate Plus  | drinking_water         | Final IBD |
| 7  | 56  | 8  | `fowl_pox_1`            | 1st Fowl Pox               | injection_wing_web     | Fowl Pox priming |
| 8  | 70  | 10 | `lasota`                | Lasota booster             | drinking_water         | Newcastle |
| 9  | 84  | 12 | `fowl_pox_2`            | 2nd Fowl Pox               | injection_wing_web     | Fowl Pox booster |
| 10 | 112 | 16 | `lasota`                | 3rd Newcastle              | drinking_water         | Newcastle pre-lay |
| 11 | 119 | 17 | `nd_ib_killed`          | ND+IB Killed (pre-lay)     | injection_subcutaneous | Long-duration ND/IB cover entering lay |

### 5.2 Production phase — recurring (Week 19+)

| Frequency | Vaccine | Delivery | Notes |
|---|---|---|---|
| Every 13 weeks (quarterly), anchored at Week 19 | `lasota` or `nd_inactivated` | drinking_water (live) or injection (killed) | Maintains Newcastle immunity for full lay cycle |

Conflicts that gate vaccine task creation: C4 (live vaccine + antibiotic 72 h) and C8 (live vaccine + chlorinated water). See `00_CONVENTIONS.md` §2.2.

---

## 6. Withdrawal Periods

Layers have **two withdrawal categories** that must be tracked independently:

- `withdrawal_days_eggs` — eggs laid during this window cannot be sold/eaten.
- `withdrawal_days_meat` — applies to spent-hen cull at end of cycle.

### 6.1 Routine medications

| Medication code | Egg withdrawal | Meat withdrawal | Production-phase use? |
|---|---|---|---|
| `amprolium`           | 0 d  | 0–24 h | Allowed (preferred coccidiostat for layers) |
| `fenbendazole`        | 0 d  | 0 d    | Monthly OK |
| `multivitamin`        | 0 d  | 0 d    | Continuous |
| `anti_stress_glucose` | 0 d  | 0 d    | OK |
| `electrolytes`        | 0 d  | 0 d    | OK |
| `calcium_supplement`  | 0 d  | 0 d    | Continuous in feed |
| `vitamin_d3`          | 0 d  | 0 d    | Weekly |

### 6.2 Antibiotics & sulfa drugs (emergency only — egg discard required)

| Medication code | Egg withdrawal | Meat withdrawal | If used → discard eggs through |
|---|---|---|---|
| `oxytetracycline`     | 7 d  | 7 d  | Day-of-last-dose + 7 |
| `tylosin`             | 5 d  | 5 d  | + 5 |
| `enrofloxacin`        | 14 d | 14 d | + 14 (also triggers C5 BLOCK) |
| `sulfadimethoxine`    | 10 d | 10 d | **Avoid in production phase** |

**Rule L-1 (egg-withdrawal accounting).** When an egg-withdrawal medication is administered, the system must:
1. Compute `discard_until = task.completed_date + medication.withdrawal_days_eggs`.
2. Tag every `egg_collection` record with `dates ≤ discard_until` as `discarded = true`, with reason = task id.
3. Surface in UI: "Discard eggs until {discard_until} — est. {birds × avg_daily_lay × days} eggs."
   See `05_EGG_PRODUCTION.md` for the discard accounting model.

**Rule L-2 (meat withdrawal at cull).** Spent-hen termination uses the same 4-day buffer pattern as broilers (`11_PROTOCOL_BROILER.md` §6); the FSM `withdrawal` state is entered before terminal sale.

---

## 7. Emergency Protocols

### 7.1 Egg Drop Syndrome (EDS)
- Signs: sudden 10–30 % production drop, soft / shell-less eggs.
- Treatment: `multivitamin` 1.5 tbsp/gal × 5 d; reinforce calcium; verify Newcastle titre, schedule `lasota` if overdue.
- Egg withdrawal: 0 d.

### 7.2 Coccidiosis in production
- Signs: bloody droppings, production dip.
- Treatment: `amprolium` 2 tbsp/gal × 5 d, then `multivitamin` × 2 d.
- Egg withdrawal: 0 d. **Never use sulfa drugs in production** (10 d egg discard).

### 7.3 Respiratory infection
- Signs: sneezing, gasping, production dip.
- Treatment (vet-confirmed): `tylosin` 1 tsp/gal × 5 d.
- Egg withdrawal: 5 d. UI must surface estimated eggs to discard.

### 7.4 Heat stress
- `electrolytes` 0.75 tsp/gal until temperature drops; 2× water capacity.
- Egg withdrawal: 0 d.

---

## 8. Cost Estimate (GHS)

### 8.1 Rearing — 100 birds, Weeks 1–18

| Category | Qty | Estimated cost (GHS) |
|---|---|---|
| Coccidiostat (`amprolium`) | ~400 g | 100–140 |
| Multivitamins | ~300 g | 60–90 |
| Anti-stress + glucose | ~200 g | 50–70 |
| Vaccines × 11 (incl. Marek's, fowl pox, killed ND+IB) | 11 doses | 140–200 |
| Dewormers × 2 | 2 doses | 40–60 |
| **Total rearing** |  | **390–560** |

**Per-bird (rearing):** GHS 3.90–5.60.

### 8.2 Production — per month per 100 birds

| Category | Qty | Estimated cost (GHS) |
|---|---|---|
| Dewormer | 1 dose | 20–30 |
| Multivitamins | ~100 g | 20–30 |
| Newcastle vaccine (¼ of quarterly cost) | ~0.33 vial | 4–7 |
| **Total monthly** |  | **44–67** |

Costs stored in `pesewas` (`00_CONVENTIONS.md` §4.2), displayed in farm currency (`GHS` default, `NGN` allowed).

---

## 9. App Task Display Examples

### 9.1 Wizard Step 3 — Review (Layer, corrected)

```
┌─────────────────────────────────────────────┐
│ REVIEW — Layer batch, 300 birds             │
├─────────────────────────────────────────────┤
│ Lifecycle:        72–78 weeks               │
│ Phases:           brooding → starter →      │
│                   grower → developer →      │
│                   pre_lay → lay → withdrawal│
│                   → ready_to_sell           │
│ Egg production:   begins Week 19            │
│ Vaccinations:     11 in rearing             │
│                   + quarterly NCD Wk 19+    │
│ Dewormings:       2 in rearing (D49, D91)   │
│                   + monthly Wk 19+          │
│                                             │
│ [Back]   [Confirm & Create Batch]           │
└─────────────────────────────────────────────┘
```

### 9.2 Daily task list — Week 8, House B, 300 layers

```
┌─────────────────────────────────────────────┐
│ WEEK 8 TASKS — House B (300 layers)         │
├─────────────────────────────────────────────┤
│ ✓ Multivitamin (Days 50–51)                 │
│   Daily water 45 L  ≈ 11.9 gal              │
│   Dose: 11.9 tbsp                           │
│                                             │
│ □ 1st Fowl Pox Vaccination (Day 56)         │
│   Method: WING-WEB INJECTION                │
│   Dose: 0.01 ml/bird → prepare 3 ml         │
│   NOT water-based — manual administration   │
│   Auto-scheduled: multivitamin Days 57–58   │
│                                             │
│ □ Multivitamin (Days 57–58)                 │
│   Daily water 45 L                          │
│   Dose: 11.9 tbsp                           │
└─────────────────────────────────────────────┘
```

### 9.3 Production-phase tile — Week 19 (egg-production banner)

```
┌─────────────────────────────────────────────┐
│ WEEK 19 — LAY BEGINS — House B (300)        │
├─────────────────────────────────────────────┤
│ Daily water:  90 L (300ml × 300)            │
│ Egg collection: ENABLED today               │
│ □ Monthly deworm `fenbendazole` (today)     │
│ □ Lasota Newcastle BOOSTER (today)          │
│   → Next booster: Week 32                   │
│ □ Calcium in feed: continuous (see Feed)    │
└─────────────────────────────────────────────┘
```

All visible doses derive from `dose_per_gallon × (water_L / 3.785)` per `00_CONVENTIONS.md` §2.13. Injection vaccines bypass the container/dose UI and show site + per-bird ml (`00_CONVENTIONS.md` §2.12).

---

## 10. Configuration JSON

Layer protocol shares the schema defined for broilers (`11_PROTOCOL_BROILER.md` §10). Drizzle table is the same `species_config` table; the Zod `SpeciesProtocol` schema gains a `production_phase` block on the layer variant:

```ts
import { z } from 'zod';
import {
  Phase, MedicationDose, ScheduledTask,
} from './species-protocol.schema';

export const RecurringRule = z.object({
  rule_code: z.string(),                                  // e.g. 'quarterly_newcastle'
  start_week: z.number().int(),
  every_weeks: z.number().int().positive(),
  task: ScheduledTask.omit({ day: true }),
  end_week: z.number().int().optional(),
});

export const ProductionPhase = z.object({
  starts_week: z.number().int(),                          // 19 for layer
  ends_week: z.number().int().optional(),                 // omitted = until termination
  monthly_cycle: z.array(ScheduledTask),                  // anchored at week 0 of each 4-wk cycle
  recurring_vaccinations: z.array(RecurringRule),
  egg_tracking: z.object({
    enabled: z.literal(true),
    track_discards: z.literal(true),
  }),
});

export const LayerProtocol = z.object({
  species: z.literal('layer'),
  schema_version: z.literal(1),
  lifecycle_weeks_min: z.number().int(),
  lifecycle_weeks_max: z.number().int(),
  default_termination_week: z.number().int(),
  traditional_remedies: z.literal(false),
  phases: z.array(Phase),
  medications: z.array(MedicationDose),
  rearing_schedule: z.array(ScheduledTask),               // explicit Day 1–~126 schedule
  production_phase: ProductionPhase,
});

export type LayerProtocolT = z.infer<typeof LayerProtocol>;
```

Complete seed value for `species = 'layer'`:

```json
{
  "species": "layer",
  "schema_version": 1,
  "lifecycle_weeks_min": 72,
  "lifecycle_weeks_max": 78,
  "default_termination_week": 78,
  "traditional_remedies": false,
  "phases": [
    { "code": "brooding",      "start_day": 1,   "end_day": 14,  "per_bird_water_ml": 50  },
    { "code": "starter",       "start_day": 15,  "end_day": 28,  "per_bird_water_ml": 100 },
    { "code": "grower",        "start_day": 29,  "end_day": 56,  "per_bird_water_ml": 150 },
    { "code": "pre_lay",       "start_day": 57,  "end_day": 126, "per_bird_water_ml": 250 },
    { "code": "lay",           "start_day": 127, "end_day": 504, "per_bird_water_ml": 300 },
    { "code": "withdrawal",    "start_day": 505, "end_day": 510, "per_bird_water_ml": 300 },
    { "code": "ready_to_sell", "start_day": 511, "end_day": 546, "per_bird_water_ml": 300 }
  ],
  "medications": [
    { "medication_code": "anti_stress_glucose", "dose_per_gallon": 1.5,  "unit": "tbsp", "delivery_method": "drinking_water",         "withdrawal_days_meat": 0, "withdrawal_days_eggs": 0  },
    { "medication_code": "multivitamin",        "dose_per_gallon": 1.0,  "unit": "tbsp", "delivery_method": "drinking_water",         "withdrawal_days_meat": 0, "withdrawal_days_eggs": 0  },
    { "medication_code": "amprolium",           "dose_per_gallon": 1.0,  "unit": "tsp",  "delivery_method": "drinking_water",         "withdrawal_days_meat": 1, "withdrawal_days_eggs": 0  },
    { "medication_code": "fenbendazole",        "dose_per_gallon": 1.0,  "unit": "ml",   "delivery_method": "drinking_water",         "withdrawal_days_meat": 0, "withdrawal_days_eggs": 0  },
    { "medication_code": "electrolytes",        "dose_per_gallon": 0.75, "unit": "tsp",  "delivery_method": "drinking_water",         "withdrawal_days_meat": 0, "withdrawal_days_eggs": 0  },
    { "medication_code": "calcium_supplement",  "dose_per_gallon": 0,    "unit": "g",    "delivery_method": "in_feed",                "withdrawal_days_meat": 0, "withdrawal_days_eggs": 0  },
    { "medication_code": "vitamin_d3",          "dose_per_gallon": 0.5,  "unit": "ml",   "delivery_method": "drinking_water",         "withdrawal_days_meat": 0, "withdrawal_days_eggs": 0  },
    { "medication_code": "oxytetracycline",     "dose_per_gallon": 1.0,  "unit": "tsp",  "delivery_method": "drinking_water",         "withdrawal_days_meat": 7, "withdrawal_days_eggs": 7  },
    { "medication_code": "tylosin",             "dose_per_gallon": 1.0,  "unit": "tsp",  "delivery_method": "drinking_water",         "withdrawal_days_meat": 5, "withdrawal_days_eggs": 5  },
    { "medication_code": "enrofloxacin",        "dose_per_gallon": 1.0,  "unit": "ml",   "delivery_method": "drinking_water",         "withdrawal_days_meat": 14,"withdrawal_days_eggs": 14 }
  ],
  "rearing_schedule": [
    { "day": 1,   "task_type": "vaccination", "vaccine_code": "mareks_hvt" },
    { "day": 1,   "task_type": "medication",  "medication_code": "anti_stress_glucose" },
    { "day": 2,   "task_type": "medication",  "medication_code": "anti_stress_glucose" },
    { "day": 3,   "task_type": "medication",  "medication_code": "anti_stress_glucose" },
    { "day": 4,   "task_type": "medication",  "medication_code": "amprolium" },
    { "day": 5,   "task_type": "medication",  "medication_code": "amprolium" },
    { "day": 6,   "task_type": "medication",  "medication_code": "amprolium" },
    { "day": 7,   "task_type": "vaccination", "vaccine_code": "gumboro_intermediate", "water_fraction": 0.5 },
    { "day": 8,   "task_type": "medication",  "medication_code": "multivitamin" },
    { "day": 9,   "task_type": "medication",  "medication_code": "multivitamin" },
    { "day": 10,  "task_type": "medication",  "medication_code": "multivitamin" },
    { "day": 11,  "task_type": "medication",  "medication_code": "amprolium" },
    { "day": 12,  "task_type": "medication",  "medication_code": "amprolium" },
    { "day": 13,  "task_type": "medication",  "medication_code": "amprolium" },
    { "day": 14,  "task_type": "vaccination", "vaccine_code": "hb1_newcastle_ib", "water_fraction": 0.5 },
    { "day": 15,  "task_type": "medication",  "medication_code": "amprolium" },
    { "day": 17,  "task_type": "medication",  "medication_code": "amprolium" },
    { "day": 19,  "task_type": "medication",  "medication_code": "amprolium" },
    { "day": 21,  "task_type": "vaccination", "vaccine_code": "gumboro_plus", "water_fraction": 0.5 },
    { "day": 22,  "task_type": "medication",  "medication_code": "anti_stress_glucose" },
    { "day": 23,  "task_type": "medication",  "medication_code": "anti_stress_glucose" },
    { "day": 24,  "task_type": "medication",  "medication_code": "anti_stress_glucose" },
    { "day": 28,  "task_type": "vaccination", "vaccine_code": "lasota", "water_fraction": 0.5 },
    { "day": 29,  "task_type": "medication",  "medication_code": "multivitamin" },
    { "day": 30,  "task_type": "medication",  "medication_code": "multivitamin" },
    { "day": 31,  "task_type": "medication",  "medication_code": "amprolium" },
    { "day": 33,  "task_type": "medication",  "medication_code": "amprolium" },
    { "day": 35,  "task_type": "vaccination", "vaccine_code": "gumboro_plus", "water_fraction": 0.5 },
    { "day": 43,  "task_type": "medication",  "medication_code": "anti_stress_glucose" },
    { "day": 44,  "task_type": "medication",  "medication_code": "anti_stress_glucose" },
    { "day": 45,  "task_type": "medication",  "medication_code": "anti_stress_glucose" },
    { "day": 49,  "task_type": "deworming",   "medication_code": "fenbendazole" },
    { "day": 50,  "task_type": "medication",  "medication_code": "multivitamin" },
    { "day": 51,  "task_type": "medication",  "medication_code": "multivitamin" },
    { "day": 56,  "task_type": "vaccination", "vaccine_code": "fowl_pox_1" },
    { "day": 57,  "task_type": "medication",  "medication_code": "multivitamin" },
    { "day": 58,  "task_type": "medication",  "medication_code": "multivitamin" },
    { "day": 70,  "task_type": "vaccination", "vaccine_code": "lasota", "water_fraction": 0.5 },
    { "day": 84,  "task_type": "vaccination", "vaccine_code": "fowl_pox_2" },
    { "day": 85,  "task_type": "medication",  "medication_code": "anti_stress_glucose" },
    { "day": 86,  "task_type": "medication",  "medication_code": "anti_stress_glucose" },
    { "day": 87,  "task_type": "medication",  "medication_code": "anti_stress_glucose" },
    { "day": 91,  "task_type": "deworming",   "medication_code": "fenbendazole" },
    { "day": 112, "task_type": "vaccination", "vaccine_code": "lasota", "water_fraction": 0.5 },
    { "day": 119, "task_type": "vaccination", "vaccine_code": "nd_ib_killed" }
  ],
  "production_phase": {
    "starts_week": 19,
    "monthly_cycle": [
      { "day": 1,  "task_type": "deworming",  "medication_code": "fenbendazole" },
      { "day": 2,  "task_type": "medication", "medication_code": "multivitamin" },
      { "day": 3,  "task_type": "medication", "medication_code": "multivitamin" },
      { "day": 15, "task_type": "medication", "medication_code": "amprolium",     "notes": "only if cocci risk flagged" },
      { "day": 22, "task_type": "medication", "medication_code": "multivitamin" },
      { "day": 25, "task_type": "medication", "medication_code": "vitamin_d3" }
    ],
    "recurring_vaccinations": [
      {
        "rule_code": "quarterly_newcastle",
        "start_week": 19,
        "every_weeks": 13,
        "task": { "task_type": "vaccination", "vaccine_code": "lasota", "water_fraction": 0.5 }
      }
    ],
    "egg_tracking": { "enabled": true, "track_discards": true }
  }
}
```

The task generator (`04_WATER_HEALTH.md` §7) materialises:
- `rearing_schedule` entries while `batch.current_week ≤ 18`.
- The `production_phase.monthly_cycle` for `current_week ≥ 19`, anchored to `(current_week - 19) % 4 === 0`.
- `recurring_vaccinations` matched by week predicate.

---

## 11. Notes & References

- **Production phase = Week 19+** everywhere (per `00_CONVENTIONS.md` §2.1). All historical references to "Week 17" in the original Layer / Master / Batch / Egg-Production documents are superseded.
- **Lifecycle 72–78 weeks**, default termination Week 78 (`00_CONVENTIONS.md` §2.4).
- **11 vaccinations enumerated** in §5.1 (Marek's HVT through pre-lay killed ND+IB) — fixes validation report findings around layer vaccination completeness.
- **Egg vs meat withdrawal** are distinct columns on the medication record and tracked separately in `health_tasks` and `egg_collections` (Rule L-1).
- **Quarterly Newcastle boosters** are encoded as a `RecurringRule` with `every_weeks: 13`, anchored at Week 19.
- **Dose derivation** follows `00_CONVENTIONS.md` §2.13. The legacy `(water_L / 3.785) × 1.5` formula is retired.
- **Conflict matrix:** see `00_CONVENTIONS.md` §2.2. Of particular layer-relevance: C1 (Amprolium + sulfa BLOCK), C4 (live vaccine + antibiotic 72 h), C7 (calcium + tetracycline — common in layers), C8 (live vaccine + chlorinated water).
- Original source preserved at `attached_assets/LAYER_1777797788375.md`.

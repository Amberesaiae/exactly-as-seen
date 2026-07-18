# Turkey Protocol

**Status:** Spec v2 (rewritten 2026-05-03)
**Species code:** `turkey`
**Lifecycle:** **configurable 12–20 weeks, default 16** (CONVENTIONS §2.5). Phase boundaries are stored as **percentages of cycle length**, not hard week numbers.
**Traditional remedies:** YES — culturally appropriate; oregano and garlic have research-supported antiprotozoal activity relevant to Blackhead support (see §7).

---

## 1. Overview

Turkeys are raised across Ghana and Nigeria for festive-season meat (Christmas, Easter, Eid) and to a lesser extent for breeding stock. The protocol is designed around **two non-negotiables**:

1.1. **Blackhead disease (Histomoniasis) is the #1 turkey killer.** Metronidazole-based prevention every 2 weeks is mandatory and is treated as a first-class element of this protocol (see §4.0 and CONVENTIONS §2.10).
1.2. **Lifecycle is variable.** Farmers select 12–20 weeks at batch creation. The FSM phase thresholds and the medication schedule scale with the chosen `lifecycle_weeks`. See `02_BATCH_MANAGEMENT.md` §4 for the wizard input and §6 for FSM scaling.
1.3. Fowl Pox vaccinations are **wing-web injections** (`delivery_method = 'injection_wing_web'`), not water-based (CONVENTIONS §2.12). UI handling in §10.2.
1.4. Turkeys are **highly stress-sensitive** — anti-stress courses bracket every vaccination and handling event.
1.5. **Never co-house turkeys with chickens.** Chickens are asymptomatic carriers of *Heterakis gallinarum*, the vector of Blackhead.

---

## 2. Water Consumption Table

| Week | ml/bird/day | 50 birds | 100 birds | Phase tag |
|---|---|---|---|---|
| 1–2 | 100 | 5 L | 10 L | brooding |
| 3–4 | 150 | 7.5 L | 15 L | starter |
| 5–6 | 200 | 10 L | 20 L | grower |
| 7–8 | 300 | 15 L | 30 L | grower |
| 9–10 | 350 | 17.5 L | 35 L | developer |
| 11–12 | 400 | 20 L | 40 L | finisher |
| 13–14 | 450 | 22.5 L | 45 L | finisher |
| 15–16 | 500 | 25 L | 50 L | pre-sale |
| 17–20 | 550 | 27.5 L | 55 L | extended finisher |

For `lifecycle_weeks < 16`, the table is truncated; for `> 16`, the 17+ row is reused.

### 2.1 Phase thresholds (percentage-based)

Stored on `species_config.phase_thresholds_pct`. Resolved to weeks per batch as `round(pct × lifecycle_weeks)`.

| Phase | Threshold (% of cycle) | Example for 16-wk | Example for 12-wk | Example for 20-wk |
|---|---|---|---|---|
| brooding → starter | 12.5% | end of Week 2 | end of Week 1 (rounded) | end of Week 2 (rounded down) |
| starter → grower | 25% | end of Week 4 | end of Week 3 | end of Week 5 |
| grower → developer | 50% | end of Week 8 | end of Week 6 | end of Week 10 |
| developer → finisher | 75% | end of Week 12 | end of Week 9 | end of Week 15 |
| finisher → withdrawal | 95% | start of Week 16 | start of Week 12 | start of Week 19 |

Withdrawal phase is always the **final 5%** of the cycle (minimum 7 days) — see §6.

---

## 3. Disease Profile

| Code | Disease | Risk | Window | Path |
|---|---|---|---|---|
| T1 | **Blackhead (Histomoniasis)** | VERY HIGH | Anytime | Metronidazole every 2 weeks (§4.0) |
| T2 | Fowl Pox | HIGH | Week 4+ | 3 wing-web vaccinations |
| T3 | Newcastle | HIGH | Anytime | HB1 → Lasota series |
| T4 | Gumboro (IBD) | HIGH | Week 1–5 | 3-dose Gumboro series |
| T5 | Coccidiosis | HIGH | Week 2–6 | Aggressive coccidiostat rotation |
| T6 | Aflatoxicosis | VERY HIGH | Anytime | Toxin binder mandatory in feed (see `07_FEED_CALCULATOR.md` §5) |
| T7 | Respiratory complex | HIGH | Wet season | Garlic / oxytetracycline as needed |
| T8 | Stress / piling | HIGH | Vaccination, transport | Anti-stress brackets |

---

## 4. Medication Schedule (week-by-week)

Volumes shown for **50 birds** (typical smallholder turkey flock). Doses derived per CONVENTIONS §2.13. Day numbers below are computed as `round(pct × lifecycle_weeks × 7)` from anchor percentages stored in seed config; the table here uses the 16-week default for readability.

### 4.0 Continuous: Blackhead prevention (CONVENTIONS §2.10)

| Cadence | Medication | Delivery | Dose | Notes |
|---|---|---|---|---|
| Every 2 weeks (Days 8, 22, 36, 50, 64, 78, 92, 106) | **Metronidazole** | drinking_water | per `dose_per_gallon` (typical 250 mg/L for 5 days) | #1 turkey killer prevention |

The Metronidazole row is added to the medication database with `category = 'antiprotozoal'`, `species_applies = ['turkey']`, `withdrawal_meat_days = 5`.

### 4.1 Week 1 (Days 1–7)

| Day | Medication | Delivery | Water | Dose | Purpose |
|---|---|---|---|---|---|
| 1–3 | Anti-stress + Glucose | drinking_water | 5 L | 1.5 tbsp | Arrival (turkeys very stress-sensitive) |
| 4–6 | Amprolium (coccidiostat) | drinking_water | 5 L | per `dose_per_gallon` | Prevention |
| 7 | Gumboro Intermediate | drinking_water | 2.5 L | per label | IBD |

### 4.2 Week 2 (Days 8–14)

| Day | Medication | Delivery | Water | Dose | Purpose |
|---|---|---|---|---|---|
| 8–12 | **Metronidazole** | drinking_water | 7.5 L | per label | Blackhead prevention #1 |
| 11–13 | Multivitamins | drinking_water | 7.5 L | 2 tbsp | Support |
| 14 | HB1 (Newcastle + IB) | drinking_water | 3.75 L | per label | HIGH |

### 4.3 Week 3 (Days 15–21)

| Day | Medication | Delivery | Water | Dose |
|---|---|---|---|---|
| 15–17 | Amprolium | drinking_water | 7.5 L | per `dose_per_gallon` |
| 18–20 | Multivitamins | drinking_water | 7.5 L | 2 tbsp |
| 21 | Gumboro Intermediate Plus | drinking_water | 3.75 L | per label |

### 4.4 Week 4 (Days 22–28) — early Fowl Pox

| Day | Medication | Delivery | Water | Dose |
|---|---|---|---|---|
| 22–26 | **Metronidazole** (2nd round) | drinking_water | 10 L | per label |
| 22–24 | Anti-stress | drinking_water | 10 L | 3 tbsp |
| 25–27 | Multivitamins | drinking_water | 10 L | 3 tbsp |
| 28 | **1st Fowl Pox** | **injection_wing_web** | — | 0.01 ml/bird per label |
| 28 | Lasota | drinking_water | 5 L | per label |

### 4.5 Weeks 5–8

| Day | Medication | Delivery | Notes |
|---|---|---|---|
| 35 | Gumboro Plus (3rd) | drinking_water | IBD final |
| 36–40 | Metronidazole (3rd round) | drinking_water | Blackhead |
| 42 | Multivitamins | drinking_water | Support |
| 49 | Fenbendazole (deworm) | drinking_water | Critical (Heterakis worm = Blackhead vector) |
| 50–54 | Metronidazole (4th round) | drinking_water | Post-deworm |
| 56 | **2nd Fowl Pox** | **injection_wing_web** | Booster |

### 4.6 Weeks 9–12

| Day | Medication | Delivery | Notes |
|---|---|---|---|
| 64–68 | Metronidazole (5th) | drinking_water | Blackhead |
| 70 | Lasota | drinking_water | Newcastle booster |
| 78–82 | Metronidazole (6th) | drinking_water | Blackhead |
| 84 | **3rd Fowl Pox** | **injection_wing_web** | Final |

### 4.7 Weeks 13–16 (default 16-week cycle)

| Day | Medication | Delivery | Notes |
|---|---|---|---|
| 91 | Fenbendazole | drinking_water | Pre-final deworm |
| 92–96 | Metronidazole (7th) | drinking_water | — |
| 98–104 | Anti-stress + Multivitamins | drinking_water | Pre-sale conditioning |
| 106 onward | **No further medication** | — | Withdrawal — see §6 |
| 112 | (Optional) 3rd Newcastle | drinking_water | Only if more than 2 weeks of cycle remain |

---

## 5. Vaccination Schedule Summary

Day numbers shown for default 16-week cycle. Seed config stores `cycle_pct` so they scale.

| Day (16-wk) | cycle_pct | Vaccine | `delivery_method` | Site / container | Priority |
|---|---|---|---|---|---|
| 7 | 6.25% | Gumboro Intermediate | drinking_water | container | HIGH |
| 14 | 12.5% | HB1 (Newcastle + IB) | drinking_water | container | HIGH |
| 21 | 18.75% | Gumboro Intermediate Plus | drinking_water | container | HIGH |
| 28 | 25% | **1st Fowl Pox** | **injection_wing_web** | wing web | CRITICAL (early for turkeys) |
| 28 | 25% | Lasota | drinking_water | container | HIGH |
| 35 | 31.25% | Gumboro Intermediate Plus (3rd) | drinking_water | container | HIGH |
| 56 | 50% | **2nd Fowl Pox** | **injection_wing_web** | wing web | HIGH |
| 70 | 62.5% | Lasota | drinking_water | container | HIGH |
| 84 | 75% | **3rd Fowl Pox** | **injection_wing_web** | wing web | HIGH |
| 112 | 100%-ε | 3rd Newcastle (optional) | drinking_water | container | OPTIONAL |

UI must hide container/dose widgets for `injection_wing_web` rows and instead show site, ml/bird, and "manual administration" notice (CONVENTIONS §2.12).

---

## 6. Withdrawal Periods

| Medication | Meat withdrawal | Notes |
|---|---|---|
| Amprolium | 0–24 h | — |
| Fenbendazole | 0 days | — |
| Metronidazole | 5 days | Blackhead preventive — must end ≥ 5 days before slaughter |
| Oxytetracycline | 7 days | — |
| Enrofloxacin | 14 days | — |
| Traditional remedies | 0 days | — |

Withdrawal phase = **final 5% of `lifecycle_weeks`** (minimum 7 days). The FSM transitions to `withdrawal` automatically (see `02_BATCH_MANAGEMENT.md` §4).

---

## 7. Traditional Remedies

All stored in `traditional_remedies` with `species_applies` including `turkey`. **0-day withdrawal.**

### 7.1 Garlic (Allium sativum) — antimicrobial / antiprotozoal support
- 8–10 crushed cloves per litre, steep ≥ 4 h.
- Duration: 5–7 days treatment, 2–3 days weekly prevention.
- **Why turkey-critical:** allicin has documented antiprotozoal activity (see references) and may reduce *Histomonas meleagridis* burden adjunctively. **Not a substitute for Metronidazole.**

### 7.2 Oregano (Origanum vulgare) — natural antiprotozoal / gut
- Fresh: 50 g steeped in 1 L boiling water → 100 ml/L drinking water.
- Dried: 1 tbsp per gallon, 2 h steep.
- Duration: 3–5 days; alternate fortnightly with garlic.
- **Research:** carvacrol (oregano oil) shown in vitro to inhibit *Histomonas meleagridis* (Zenner et al. 2003).

### 7.3 Apple Cider Vinegar — gut pH / mild antimicrobial
- 1 tbsp per gallon, 2–3 days/week.
- **Caution:** must not coincide with Metronidazole or any tetracycline (CONVENTIONS §2.2 C7 — calcium chelation analogue; spec uses 4 h gap rule).

### 7.4 Aloe Vera — stress / digestive
- 50 ml gel solution per litre. Duration: 3–5 days.
- Use: arrival, post-vaccination, heat stress.

### 7.5 Neem — supportive deworming / immune
- 100 g leaves boiled in 2 L; add 100 ml/L. Duration: 3 days; monthly.

---

## 8. Emergency Protocols

| Emergency | Indicator | First action | Within 24 h |
|---|---|---|---|
| **Suspected Blackhead** | Sulfur-yellow droppings, drooping, dark head, sudden death | Immediate Metronidazole all birds; isolate visibly sick | Vet consult, post-mortem (cecal cores diagnostic) |
| Heat stress (≥ 35 °C) | Panting, piling | Aloe + electrolytes, ventilation | Reduce stocking |
| Piling / suffocation risk | Bird density build-up at corner | Disperse, music/ambient noise | Investigate stress trigger |
| Suspected Fowl Pox outbreak | Skin nodules | Isolate affected; emergency wing-web vaccination of unaffected | Vet |
| Suspected aflatoxicosis | Stunted growth, pale liver post-mortem | Stop current feed batch; switch to clean feed | Lab test feed; recall stock |

Emergency overrides via `POST /batches/:id/health-tasks/emergency` (see `03_WATER_HEALTH.md` §5.4). The C4 vaccine + antibiotic 72 h rule (CONVENTIONS §2.2) still applies — emergency Metronidazole given within 72 h of an upcoming live vaccine forces the vaccine to be rescheduled.

---

## 9. Cost Estimate

### 9.1 50 birds, 16-week default cycle (GHS)

| Approach | Total | Per bird |
|---|---|---|
| Pharmaceutical-only | 475–675 | 9.50–13.50 |
| Mixed (traditional + targeted pharma) | 280–410 | 5.60–8.20 |

Metronidazole is the largest line item (~80–120 GHS for the cycle) and is **not** removable in the mixed approach — Blackhead prevention is non-negotiable.

### 9.2 Scaling

Cost is `cost_estimate_pesewas_per_bird_per_week × birds × lifecycle_weeks`. Stored as base rates per phase in seed config.

---

## 10. App Task Display Examples

### 10.1 Blackhead preventive (water — high priority banner)

```
┌─ WEEK 2 — Turkey House A (50 birds) ────────┐
│ ⚠ BLACKHEAD PREVENTION — DO NOT SKIP        │
│ □ Metronidazole (Days 8–12)                 │
│   Pour per-label dose into 7.5 L water      │
│   Container: Bell Drinker 6L (×2 fills)     │
│   Delivery: Drinking water                  │
│   Withdrawal: 5 days (auto-tracked)         │
└─────────────────────────────────────────────┘
```

### 10.2 Fowl Pox vaccine (`injection_wing_web`)

```
┌─ DAY 28 — Turkey House A (50 birds) ────────┐
│ ⚠ 1st Fowl Pox Vaccine — EARLY for turkeys  │
│   Delivery: Wing-web injection              │
│   Site: Underside of wing web (loose skin)  │
│   Dose: 0.01 ml per bird (use stab needle)  │
│   Total needed: ~1 vial (200-dose) + spare  │
│   Manual administration — no water mixing.  │
│   [Mark complete] [Record reactions]        │
└─────────────────────────────────────────────┘
```

The Complete-Task modal hides container picker and dose-from-water-volume calculator when `delivery_method = 'injection_wing_web'`, exactly as for `injection_subcutaneous` (see `13_PROTOCOL_DUCK.md` §10.2).

### 10.3 Stress-bracket prompt

When the scheduler creates a vaccination task, it also creates a paired anti-stress task 48 h before and 48 h after, marked with `linked_to_task_id`. UI groups them under "Vaccination prep & recovery."

---

## 11. Configuration JSON

```json
{
  "species": "turkey",
  "variant": null,
  "default_lifecycle_weeks": 16,
  "min_lifecycle_weeks": 12,
  "max_lifecycle_weeks": 20,
  "egg_production": false,
  "egg_production_start_week": null,
  "phase_thresholds_pct": {
    "brooding_to_starter": 0.125,
    "starter_to_grower": 0.25,
    "grower_to_developer": 0.50,
    "developer_to_finisher": 0.75,
    "finisher_to_withdrawal": 0.95
  },
  "withdrawal_min_days": 7,
  "water_table": [
    { "from_week": 1, "to_week": 2, "ml_per_bird_per_day": 100 },
    { "from_week": 3, "to_week": 4, "ml_per_bird_per_day": 150 },
    { "from_week": 5, "to_week": 6, "ml_per_bird_per_day": 200 },
    { "from_week": 7, "to_week": 8, "ml_per_bird_per_day": 300 },
    { "from_week": 9, "to_week": 10, "ml_per_bird_per_day": 350 },
    { "from_week": 11, "to_week": 12, "ml_per_bird_per_day": 400 },
    { "from_week": 13, "to_week": 14, "ml_per_bird_per_day": 450 },
    { "from_week": 15, "to_week": 16, "ml_per_bird_per_day": 500 },
    { "from_week": 17, "to_week": null, "ml_per_bird_per_day": 550 }
  ],
  "medication_schedule": [
    { "cycle_pct": 0.000, "duration_days": 3, "medication_code": "anti_stress_glucose", "delivery_method": "drinking_water" },
    { "cycle_pct": 0.0268, "duration_days": 3, "medication_code": "amprolium", "delivery_method": "drinking_water" },
    { "cycle_pct": 0.0625, "duration_days": 5, "medication_code": "metronidazole", "delivery_method": "drinking_water", "tag": "blackhead_prevention" },
    { "cycle_pct": 0.0893, "duration_days": 3, "medication_code": "multivitamins", "delivery_method": "drinking_water" },
    { "cycle_pct": 0.1339, "duration_days": 3, "medication_code": "amprolium", "delivery_method": "drinking_water" },
    { "cycle_pct": 0.1875, "duration_days": 5, "medication_code": "metronidazole", "delivery_method": "drinking_water", "tag": "blackhead_prevention" },
    { "cycle_pct": 0.1875, "duration_days": 3, "medication_code": "anti_stress", "delivery_method": "drinking_water" },
    { "cycle_pct": 0.3125, "duration_days": 5, "medication_code": "metronidazole", "delivery_method": "drinking_water", "tag": "blackhead_prevention" },
    { "cycle_pct": 0.4375, "duration_days": 1, "medication_code": "fenbendazole", "delivery_method": "drinking_water" },
    { "cycle_pct": 0.4464, "duration_days": 5, "medication_code": "metronidazole", "delivery_method": "drinking_water", "tag": "blackhead_prevention" },
    { "cycle_pct": 0.5714, "duration_days": 5, "medication_code": "metronidazole", "delivery_method": "drinking_water", "tag": "blackhead_prevention" },
    { "cycle_pct": 0.6964, "duration_days": 5, "medication_code": "metronidazole", "delivery_method": "drinking_water", "tag": "blackhead_prevention" },
    { "cycle_pct": 0.8125, "duration_days": 1, "medication_code": "fenbendazole", "delivery_method": "drinking_water" },
    { "cycle_pct": 0.8214, "duration_days": 5, "medication_code": "metronidazole", "delivery_method": "drinking_water", "tag": "blackhead_prevention" }
  ],
  "vaccination_schedule": [
    { "cycle_pct": 0.0625, "vaccine_code": "gumboro_intermediate", "delivery_method": "drinking_water", "priority": "high" },
    { "cycle_pct": 0.125, "vaccine_code": "hb1_newcastle_ib", "delivery_method": "drinking_water", "priority": "high" },
    { "cycle_pct": 0.1875, "vaccine_code": "gumboro_intermediate_plus", "delivery_method": "drinking_water", "priority": "high" },
    { "cycle_pct": 0.25, "vaccine_code": "fowl_pox_1", "delivery_method": "injection_wing_web", "dose_ml_per_bird": 0.01, "site": "wing_web", "priority": "critical" },
    { "cycle_pct": 0.25, "vaccine_code": "lasota_newcastle", "delivery_method": "drinking_water", "priority": "high" },
    { "cycle_pct": 0.3125, "vaccine_code": "gumboro_intermediate_plus", "delivery_method": "drinking_water", "priority": "high" },
    { "cycle_pct": 0.50, "vaccine_code": "fowl_pox_2", "delivery_method": "injection_wing_web", "dose_ml_per_bird": 0.01, "site": "wing_web", "priority": "high" },
    { "cycle_pct": 0.625, "vaccine_code": "lasota_newcastle", "delivery_method": "drinking_water", "priority": "high" },
    { "cycle_pct": 0.75, "vaccine_code": "fowl_pox_3", "delivery_method": "injection_wing_web", "dose_ml_per_bird": 0.01, "site": "wing_web", "priority": "high" }
  ],
  "withdrawal_periods": {
    "amprolium": { "meat_hours": 24 },
    "fenbendazole": { "meat_days": 0 },
    "metronidazole": { "meat_days": 5 },
    "oxytetracycline": { "meat_days": 7 },
    "enrofloxacin": { "meat_days": 14 }
  },
  "traditional_remedies_enabled": true,
  "traditional_remedies_meta": {
    "available_codes": ["garlic", "oregano", "apple_cider_vinegar", "aloe_vera", "neem"],
    "withdrawal_days": 0,
    "blackhead_substitute": false
  },
  "stress_bracketing": {
    "enabled": true,
    "anti_stress_hours_before_vaccine": 48,
    "anti_stress_hours_after_vaccine": 48
  },
  "cost_estimate_pesewas": {
    "pharmaceutical_only_per_bird": { "low": 950, "high": 1350 },
    "mixed_per_bird":              { "low": 560, "high": 820 }
  }
}
```

The scheduler resolves `cycle_pct` to a calendar `day_offset` at batch creation:
`day_offset = round(cycle_pct × lifecycle_weeks × 7)`. See `03_WATER_HEALTH.md` §8.2.

---

## 12. Notes & References

- CONVENTIONS §2.5 (variable lifecycle), §2.10 (Metronidazole in DB), §2.11 (timezone for daily task generation), §2.12 (delivery methods incl. `injection_wing_web`), §2.13 (dosing rule).
- Cross-refs: `02_BATCH_MANAGEMENT.md` §4 (lifecycle picker, FSM scaling), `03_WATER_HEALTH.md` §3 (medication DB incl. Metronidazole) + §5 (conflicts) + §8 (auto-task generation), `07_FEED_CALCULATOR.md` §5 (toxin binder mandatory).
- Original spec: `attached_assets/TURKEY_1777797788374.md`.
- Research:
  - Zenner, L., Callait, M.P., Granier, C., Chauve, C. (2003). "In vitro effect of essential oils from *Cinnamomum aromaticum*, *Carum carvi* and *Cuminum cyminum* on *Tritrichomonas foetus* and *Histomonas meleagridis*." *Parasite* 10(2): 153–157.
  - McDougald, L.R. (2005). "Blackhead disease (histomoniasis) in poultry: a critical review." *Avian Diseases* 49(4): 462–476.
  - Hu, J. & McDougald, L.R. (2003). "Direct lateral transmission of *Histomonas meleagridis* in turkeys." *Avian Diseases* 47(2): 489–492.

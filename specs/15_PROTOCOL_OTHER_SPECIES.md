# Other-Species Protocol

**Status:** Spec v2 (rewritten 2026-05-03)
**Species code:** `other`
**Lifecycle:** **farmer-defined**, 1–104 weeks (no default; wizard requires explicit input)
**Traditional remedies:** OPTIONAL — farmer may enable per batch; reference catalogue from Duck/Turkey protocols is exposed.

---

## 1. Overview

`species = 'other'` is the **catch-all** for any bird or small-livestock cohort that does not fit the four primary species (`broiler`, `layer`, `duck`, `turkey`). Common real-world uses in West African smallholder farms:

- Guinea fowl
- Quail (coturnix)
- Geese
- Pigeons / squab
- Ostrich chicks (rare)
- Indigenous breeds (e.g. local "village chickens" managed under non-standard cycles)

The previous spec attempted to ship full preset protocols for guinea fowl, quail and geese (see `attached_assets/OTHER-SPECIES_1777797788375.md`). **That approach is abandoned** in favour of a single generic protocol because:

1.1. Disease pressure, vaccination availability, and breed-specific lifecycles vary too much across these species to ship safe presets.
1.2. Farmers raising these species are typically experienced and prefer to enter their own protocol rather than have the app prescribe one.
1.3. Maintaining three more preset schedules created surface area for bugs in the safety conflict matrix.

**Design principle:** the `other` species is a **manual-everything** mode. The app provides the *plumbing* (batch lifecycle, water tracking, ad-hoc health tasks, conflict checks, withdrawal enforcement, cost recording) but ships **no preset medication schedule and no auto-vaccinations**.

---

## 2. Water Consumption Table

There is **no preset water table**. The Batch Creation Wizard requires the farmer to enter `ml_per_bird_per_day` per phase before the batch can be saved.

### 2.1 Wizard input — minimum required rows

| Phase | Required? | Default cell value |
|---|---|---|
| Brooding (Week 1 → end of phase) | Required | empty |
| Grower (after brooding → start of finishing) | Required | empty |
| Finisher (final phase) | Required | empty |
| Lay (only if `egg_production = true`) | Conditional | empty |

The wizard validates `0 < ml_per_bird_per_day ≤ 2000` per row and rejects empty submission. Stored in `batches.custom_water_table` (JSONB) — overrides the empty `species_config.water_table`.

### 2.2 Daily fill volume calculation

Same formula as for the primary species:

```
daily_litres = (ml_per_bird_per_day × current_birds) / 1000
```

See `03_WATER_HEALTH.md` §3.1.

---

## 3. Disease Profile

**No preset.** The system maintains a free-text `batches.disease_notes` field and a structured `batches.custom_disease_watchlist` array (codes + severity + farmer-entered prevention notes). These are surfaced on the dashboard but never auto-generate tasks.

Farmer may import a disease watchlist from any of the primary-species configs as a starting point (UI: "Copy disease list from broiler / layer / duck / turkey").

---

## 4. Medication Schedule (week-by-week)

**No preset schedule is shipped.** All health tasks for `other` batches are created via:

| Mechanism | Endpoint | Notes |
|---|---|---|
| Ad-hoc (single occurrence) | `POST /batches/:id/health-tasks` | Standard ad-hoc creation, see `03_WATER_HEALTH.md` §5.2 |
| Repeating | `POST /batches/:id/health-tasks/recurring` | Farmer specifies cadence, duration, medication, dose |
| Bulk import from another batch | `POST /batches/:id/health-tasks/copy-from?source_batch_id=…` | Copies all future-dated tasks from a source batch |

### 4.1 Conflict checks still apply

Every task (ad-hoc or recurring) for an `other` batch passes through the same conflict matrix as primary species (CONVENTIONS §2.2 C1–C8). The matrix is medication-driven, not species-driven.

### 4.2 Niacin (duck-only auto-task) does **not** apply

The Water-Health niacin auto-task generator only fires for `species = 'duck'` (see `03_WATER_HEALTH.md` §8.3). For `other` batches the farmer must add niacin (or any other supplement) manually if the species needs it.

---

## 5. Vaccination Schedule Summary

**No preset vaccinations.** The wizard surfaces a checklist of common poultry vaccines (Newcastle HB1, Lasota, Gumboro, Fowl Pox wing-web, Goose Parvovirus injection, etc.) sourced from the `vaccines` reference table; the farmer ticks the ones to schedule and enters target days.

The full vaccine catalogue (and `delivery_method` per vaccine) lives in the medication database (`03_WATER_HEALTH.md` §3). For `other` batches, the catalogue is read-only reference — nothing is auto-scheduled.

---

## 6. Withdrawal Periods

Withdrawal periods are **medication-driven**, not species-driven. When the farmer adds a medication to a batch, the medication's `withdrawal_meat_days` / `withdrawal_egg_days` (from the medication database) drive the FSM withdrawal calculation identically to the primary species.

If the farmer enters a custom medication not in the database, the `POST /batches/:id/health-tasks` endpoint requires `withdrawal_meat_days` and (if `egg_production = true`) `withdrawal_egg_days` in the request body before accepting the task.

---

## 7. Traditional Remedies

The 5 duck/turkey traditional remedies (Aloe Vera, Neem, Papaya Seeds, Garlic, Turmeric, Oregano, Apple Cider Vinegar) are exposed as a reference library for `other` batches. Farmers can enable them per batch via the "Allow traditional remedies" toggle in the wizard.

When enabled, the app shows traditional alternatives alongside any farmer-added pharmaceutical task with a matching `purpose` tag (e.g. "anti-stress", "deworming", "respiratory").

---

## 8. Emergency Protocols

Generic emergency mechanism applies (`POST /batches/:id/health-tasks/emergency` — see `03_WATER_HEALTH.md` §5.4). No species-specific emergency presets.

The dashboard exposes a "Mass mortality" quick-action that:

8.1. Records the mortality count to `batch_mortality_events`.
8.2. Pauses all upcoming auto-generated tasks (none exist for `other`, but consistency with primary species).
8.3. Prompts the farmer to enter notes and (optionally) attach a photo for vet consultation.

---

## 9. Cost Estimate

**No preset cost estimate.** Cost is computed from actual `health_tasks.cost_pesewas` and `feed_records.cost_pesewas` rolled up by the Records module (see `09_RECORDS.md` §3). The dashboard never displays a "cost-per-bird estimate" for `other` batches because no projection is possible without a preset.

---

## 10. App Task Display Examples

### 10.1 Empty week (no tasks scheduled)

```
┌─ WEEK 4 — Guinea Fowl House (50 birds) ─────┐
│                                              │
│  No tasks scheduled this week.               │
│                                              │
│  [+ Add health task]                         │
│  [+ Schedule vaccination]                    │
│  [Copy schedule from another batch]          │
│                                              │
└──────────────────────────────────────────────┘
```

### 10.2 Ad-hoc farmer-added task

```
┌─ DAY 28 — Guinea Fowl House (50 birds) ─────┐
│ □ Fenbendazole (deworming)                   │
│   Added: 2026-05-01 by you                   │
│   Container: Local Drinker 10L               │
│   Dose: per `dose_per_gallon` × 10 L         │
│   Withdrawal: 0 days (auto from med DB)      │
│   [Mark complete]                            │
└──────────────────────────────────────────────┘
```

### 10.3 Wizard prompt for water table

```
┌─ Create batch — Step 2 of 4 ─────────────────┐
│ Species: Other (Guinea Fowl)                 │
│                                              │
│ Water consumption (required) — ml/bird/day   │
│   Brooding (Wk 1–2):    [   75 ]            │
│   Grower (Wk 3–6):      [  125 ]            │
│   Finisher (Wk 7+):     [  200 ]            │
│                                              │
│ [Back]                              [Next]   │
└──────────────────────────────────────────────┘
```

UI displays no auto-generated tasks badge, no "X vaccinations scheduled" summary, and no preset medication count. The Step 3 review for an `other` batch shows: "0 tasks scheduled — you can add tasks after the batch is created."

---

## 11. Configuration JSON

A single seed row is inserted with empty/permissive defaults:

```json
{
  "species": "other",
  "variant": null,
  "default_lifecycle_weeks": null,
  "min_lifecycle_weeks": 1,
  "max_lifecycle_weeks": 104,
  "egg_production": false,
  "egg_production_start_week": null,
  "phase_thresholds_pct": {
    "brooding_to_grower": 0.20,
    "grower_to_finisher": 0.70,
    "finisher_to_withdrawal": 0.95
  },
  "withdrawal_min_days": 7,
  "water_table": [],
  "medication_schedule": [],
  "vaccination_schedule": [],
  "withdrawal_periods": {},
  "traditional_remedies_enabled": false,
  "traditional_remedies_meta": {
    "available_codes": ["aloe_vera", "neem", "papaya_seeds", "garlic", "turmeric", "oregano", "apple_cider_vinegar"],
    "withdrawal_days": 0,
    "opt_in_per_batch": true
  },
  "requires_custom_water_table": true,
  "requires_custom_lifecycle_weeks": true,
  "auto_generate_health_tasks": false,
  "auto_generate_vaccinations": false,
  "cost_estimate_pesewas": null
}
```

### 11.1 Per-batch overrides

Because `species_config` is empty for `other`, two columns on `batches` carry the per-batch overrides:

```ts
// lib/db/src/schema/batches.ts (excerpt — additions for 'other' species)
export const batches = pgTable('batches', {
  // ... existing columns ...
  custom_water_table: jsonb('custom_water_table').$type<WaterTableEntry[]>(),
  custom_disease_watchlist: jsonb('custom_disease_watchlist').$type<DiseaseWatchlistEntry[]>(),
  allow_traditional_remedies: boolean('allow_traditional_remedies').notNull().default(false),
});
```

`custom_water_table` is **required** (NOT NULL at the application layer via Zod) when `species = 'other'`. The Drizzle column is nullable to keep the schema unified across species; the constraint is enforced in the create-batch handler:

```ts
// artifacts/api-server/src/modules/batch/create-batch.ts (excerpt)
import { z } from 'zod';

const createBatchSchema = z.object({
  species: z.enum(['broiler', 'layer', 'duck', 'turkey', 'other']),
  duck_type: z.enum(['meat', 'layer']).optional(),
  lifecycle_weeks: z.number().int().min(1).max(104),
  custom_water_table: z.array(z.object({
    from_week: z.number().int().min(1),
    to_week: z.number().int().nullable(),
    ml_per_bird_per_day: z.number().int().min(1).max(2000),
  })).min(1).optional(),
  // ...
}).superRefine((v, ctx) => {
  if (v.species === 'other' && (!v.custom_water_table || v.custom_water_table.length === 0)) {
    ctx.addIssue({
      code: 'custom',
      path: ['custom_water_table'],
      message: 'custom_water_table is required for species=other',
    });
  }
  if (v.species === 'other' && !v.lifecycle_weeks) {
    ctx.addIssue({
      code: 'custom',
      path: ['lifecycle_weeks'],
      message: 'lifecycle_weeks is required for species=other',
    });
  }
});
```

---

## 12. Notes & References

- CONVENTIONS §2.2 (conflict matrix applies regardless of species), §2.11 (scheduler timezone — daily task generation still runs but produces zero tasks for `other` batches with no schedule), §2.12 (delivery_method on each manually added task), §2.13 (dosing rule).
- Cross-refs: `02_BATCH_MANAGEMENT.md` §4 (wizard branching for `other`), `03_WATER_HEALTH.md` §5 (ad-hoc + recurring task creation endpoints), §3 (medication DB read-only catalogue), `09_RECORDS.md` §3 (cost rollups).
- Original spec: `attached_assets/OTHER-SPECIES_1777797788375.md` (preserved for traceability — rejected in favour of a single generic profile; the per-species presets there can be re-introduced later as **starter templates** the farmer applies on top of `other`, but they are out of scope for v2).
- Open question (deferred): if/when demand justifies it, promote guinea fowl to a first-class species with a preset modelled on Layer + early Fowl Pox; promote quail with a 6–8-week meat preset modelled on Broiler scaled down. Until then, the manual `other` profile is sufficient.

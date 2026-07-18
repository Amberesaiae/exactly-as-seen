# T1 — Lib Data Fixes: niacin removal, vaccination templates, duck egg curve, broiler phase boundary

## Context

Four reference data files contain spec violations. All changes are in-place edits to existing arrays and functions — no new files, no interface changes.

**Spec reference:** spec:e4556d74-53bc-432d-b750-3db37d529bab/48044335-1541-401c-9c23-8503e1d648ae — Changes 1, 2, 3, 4.

## Scope

### file:src/lib/feed-data.ts

**Remove** the `niacin_duck` entry from `SAFETY_RULES` (lines 131–140 — the entire object from `id: 'niacin_duck'` through its closing `},`).

**Remove** the duck niacin auto-add block from `getCompulsorySupplements` (lines 209–215 — the `if (species === 'duck')` block).

**Keep** line 68: `{ name: 'Niacin (Vitamin B3)', ... }` in `INGREDIENTS` — it is a valid ingredient a farmer can manually select.

**Why:** CONVENTIONS §2.9 — niacin is a water additive, not a feed ingredient. Auto-forcing it in the feed calculator is wrong.

### file:src/lib/feed-optimizer.ts

**Remove** line 52: `else if (name.includes('niacin')) allocations[idx] = targetKg * 0.001;`

The `else` branch at line 53 (`allocations[idx] = targetKg * 0.005`) already handles any supplement not explicitly named. Niacin falls through to it correctly after this removal.

**Why:** The niacin-specific 0.1% allocation is wrong — niacin is not a feed supplement.

### file:src/lib/health-data.ts

**Replace** the broiler entries in `VACCINATION_TEMPLATES`. Currently there are 6 broiler-tagged entries (Marek's wk0, Newcastle HB1 wk1, Gumboro IBD 1st wk2, Gumboro IBD 2nd wk3, Newcastle Lasota wk4, Fowl Pox wk6). Replace them with exactly 5 canonical entries:

| `scheduledWeek` | `name` | `route` |
| --- | --- | --- |
| 1 | Gumboro Intermediate | Drinking water |
| 2 | HB1 (Newcastle + IB) | Eye drop / Drinking water |
| 3 | Gumboro Intermediate Plus | Drinking water |
| 4 | Lasota (Newcastle) | Drinking water |
| 5 | Gumboro Intermediate Plus | Drinking water |

**Non-broiler entries that stay untouched:** Newcastle Booster (layer/duck wk8), Fowl Typhoid (layer wk10), Newcastle Komarov (layer wk16), Duck Hepatitis (duck wk1), Duck Plague (duck wk8), Blackhead (turkey wk3).

**Fix** the duck `EGG_PRODUCTION_CURVES` in the same file:

- Rearing phase: `weekEnd: 20` → `weekEnd: 19`
- Early phase: `weekStart: 21` → `weekStart: 20`

**Why:** CONVENTIONS §2.8 (broiler vaccines), §2.7 (duck egg production starts Week 20).

**Downstream note:** file:src/pages/BatchCreate.tsx line 82 seeds `vaccination_schedule` from `VACCINATION_TEMPLATES`. After this fix, new broiler batches will get the correct 5 vaccinations. Existing DB rows are unaffected — no migration needed.

### file:src/lib/batch-utils.ts

**Change** line 7: `{ name: 'starter', weekEnd: 2 }` → `{ name: 'starter', weekEnd: 3 }`

**Why:** file:specs/02_BATCH_MANAGEMENT.md §2.3 — broiler starter = weeks 1–3. Currently a broiler in week 3 returns `phase: 'grower'` from `getBatchAge()`. After the fix it correctly returns `phase: 'starter'`.

## Acceptance Criteria

1. `SAFETY_RULES` in `feed-data.ts` has no entry with `id: 'niacin_duck'`
2. `getCompulsorySupplements` never pushes niacin for any species
3. `INGREDIENTS` still contains `Niacin (Vitamin B3)` (unchanged)
4. `feed-optimizer.ts` has no `name.includes('niacin')` branch; niacin falls through to the generic `else`
5. `VACCINATION_TEMPLATES` filtered for `species.includes('broiler')` returns exactly 5 entries with `scheduledWeek` values 1, 2, 3, 4, 5
6. Duck `EGG_PRODUCTION_CURVES` Rearing phase ends at week 19; Early phase starts at week 20
7. `getBatchAge('2025-01-01', 'broiler')` called when current date is 15 days after start returns `phase: 'starter'` (week 3)
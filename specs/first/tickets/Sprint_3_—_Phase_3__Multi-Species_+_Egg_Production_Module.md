# Sprint 3 — Phase 3: Multi-Species + Egg Production Module

## Goal

Extend the platform to layer, duck (meat/layer), and turkey species. Implement the Egg Production module. Rebuild the Eggs page.

## Scope

### Batch Wizard Extension

- Duck Step 1b: two cards — "Meat Duck (8–10 weeks)" and "Layer Duck (72+ weeks — eggs from Week 20+)"
- Turkey cycle-length slider: 12–20 weeks, default 16; FSM phase thresholds scale as percentages
- Layer species card subtitle: "72–78 weeks" (not 68)
- Duck species card subtitle: "meat 8–10 / layer 72+ weeks"
- Step 3 review shows correct vaccination counts per species

### Batch FSM Extension

- Layer: `finisher` phase = production phase, egg tracking enabled at Week 19+
- Duck-layer: egg tracking enabled at Week 20+
- Turkey: phase boundaries computed as `round(pct × lifecycle_weeks)` from `phase_thresholds_pct` in species config

### Egg Production Module Backend (file:artifacts/api-server/src/modules/egg-production/)

DB schema (file:lib/db/src/schema/egg-production.ts):

- `egg_collections` — grade breakdown (small/medium/large/xlarge/cracked/dirty), generated columns for `total_count` and `good_count`, `production_rate_bp`
- `egg_discards` — reason enum, `withdrawal_record_id`
- `egg_sales` — crates + loose, `price_per_crate_pesewas`, `ledger_entry_id` (back-patched by Finance)

All endpoints from file:specs/05_EGG_PRODUCTION.md §5:

- Eligibility guard: broiler/turkey/duck-meat → 404 `EGG_TRACKING_NOT_APPLICABLE`
- Layer start week guard: Week < 19 → 409 `BEFORE_LAY_START`
- Duck-layer start week guard: Week < 20 → 409 `BEFORE_LAY_START`
- Sale withdrawal guard: active withdrawal → 409 `WITHDRAWAL_ACTIVE`
- Inventory derived query (no stored table)
- `EGG_SALE_RECORDED` published → Finance creates revenue row + back-patches `ledger_entry_id`

### Eggs Page Rebuild — replace file:artifacts/lampfarms/src/pages/Eggs.tsx

Components (each ≤250 lines):

- `BatchPicker` (layer + duck-layer only)
- `ProductionHeader` — rate vs expected, withdrawal banner if active
- `CollectionDialog` — 6 grade inputs (S/M/L/XL/cracked/dirty)
- `SaleDialog` — crates + loose, price, buyer, payment method
- `RecordsTable`, `SalesTable`, `WeeklySummary`

## Acceptance Criteria

Duck batch creation wizard shows Step 1bTurkey batch creation shows cycle-length slider (12–20)Layer Week 18 egg collection → 409 BEFORE_LAY_START; Week 19 → 201Duck-layer Week 19 → 409; Week 20 → 201Broiler batch → 404 EGG_TRACKING_NOT_APPLICABLESale during active withdrawal → 409 WITHDRAWAL_ACTIVEEGG_SALE_RECORDED → Finance revenue row created; ledger_entry_id back-patchedEggs page shows only layer + duck-layer batches in pickerCollection dialog has 6 grade inputspnpm run typecheck passes
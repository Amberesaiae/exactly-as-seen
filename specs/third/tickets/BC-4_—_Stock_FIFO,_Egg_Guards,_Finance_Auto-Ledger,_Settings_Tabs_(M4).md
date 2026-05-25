# BC-4 — Stock FIFO, Egg Guards, Finance Auto-Ledger, Settings Tabs (M4)

## Overview

Four correctness gaps fixed in one ticket: FIFO+quality stock allocation, egg inventory/withdrawal guards, complete finance auto-ledger, and Settings 5-tab completion.

**Spec reference:** spec:e4556d74-53bc-432d-b750-3db37d529bab/`[M4 spec id]`

## Scope

### Stock — FIFO allocator

Create Supabase Postgres function `allocate_fifo_by_quality(farm_id, item_id, qty_needed, batch_id, reason, source_ref_id)` with `FOR UPDATE` row locking and the sort order: near-expiry bucket first → expiry ASC → received_at ASC → exclude damaged.

Update file:src/hooks/useStockData.ts:

- Fix `item_id` → `stock_item_id` (already in BC-1, verify here)
- Replace flat `current_quantity` tracking with lot-based tracking via `stock_lots`
- Fix purchase expense category mapping
- Add `suppliers` support

### Eggs — inventory guards

Create Supabase Postgres function `get_egg_inventory(batch_id, farm_id)` returning `good_eggs_on_hand`.

Update file:src/hooks/useEggData.ts:

- `recordSale`: call `get_egg_inventory()` before insert; reject if insufficient
- `recordSale`: check `batch.has_active_withdrawal`; reject if true
- `recordCollection`: check for duplicate `(batch_id, date)`; reject if exists
- `recordCollection`: check start week guard (layer ≥ 19, duck-layer ≥ 20)
- Populate `batch_id` on `egg_sales` insert

### Finance — auto-ledger completion

Update file:src/hooks/useHealthData.ts `markTaskComplete`: replace `amount: 0` with `cost_pesewas` from user input in the Complete Task modal.

Update file:src/hooks/useStockData.ts `recordTransaction`: fix expense category mapping.

Update file:src/pages/BatchCreate.tsx: add chick purchase amount field in Step 3; insert `chicks_and_birds` expense after batch creation.

Update file:src/hooks/useEggData.ts `recordSale`: insert revenue entry with `source: 'auto:eggs'`.

Update file:src/pages/BatchDetail.tsx terminate handler: add sale amount field in terminate dialog; insert `bird_sales`/`meat_sales` revenue when amount > 0.

All auto-ledger inserts use `ON CONFLICT DO NOTHING` on `(source, source_ref)`.

### Settings — 5-tab completion

Update file:src/pages/SettingsPage.tsx:

- Farm tab: add `water_source_chlorinated` toggle, `egg_low_inventory_crates` input, `timezone` select
- Preferences tab: add PIN setup (4-digit, SHA-256 hashed, stored in `user_preferences.cost_privacy_pin`)
- Add Market Prices tab: reads/writes `config_overrides` table; rejects safety key prefixes
- Add Data tab: export buttons + account deletion with confirmation phrase

## Acceptance Criteria

- FIFO allocator: near-expiry lots used first; damaged excluded; concurrent calls don't overdraw
- Egg sale rejected when inventory insufficient
- Egg sale rejected during active withdrawal
- Duplicate collection rejected with clear toast
- Layer collection rejected before week 19; duck-layer before week 20
- `markTaskComplete` expense uses user-entered `cost_pesewas`
- Stock purchase expense uses correct category
- Batch creation creates `chicks_and_birds` expense
- Egg sale creates revenue entry
- All auto-ledger entries idempotent via `ON CONFLICT DO NOTHING`
- Settings has 5 tabs; Market Prices reads/writes `config_overrides`; PIN hashed before storage

## Dependencies

BC-1 (schema — `stock_lots`, `stock_allocations`, `egg_sales.batch_id`, `config_overrides`, `user_preferences.cost_privacy_pin`)
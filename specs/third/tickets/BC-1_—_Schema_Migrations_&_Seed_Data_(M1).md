# BC-1 — Schema Migrations & Seed Data (M1)

## Overview

Implement all 4 SQL migrations and seed data that every other module depends on. This is the P0 foundation — nothing else can be correctly implemented until this is done.

**Spec reference:** spec:e4556d74-53bc-432d-b750-3db37d529bab/`[M1 spec id]`

## Scope

### Migration 4 — Column additions

Add to file:supabase/migrations/ a new SQL file that adds:

- `farms`: `water_source_chlorinated BOOLEAN DEFAULT false`, `timezone TEXT DEFAULT 'Africa/Accra'`, `currency TEXT DEFAULT 'GHS'`, `egg_low_inventory_crates INTEGER DEFAULT 5`
- `batches`: `duck_type TEXT CHECK (duck_type IN ('meat','layer'))`, `cycle_length_weeks INTEGER DEFAULT 8`, `has_active_withdrawal BOOLEAN DEFAULT false`, `termination_reason TEXT CHECK (...)`
- `batches`: CHECK constraint `duck_type_required` (duck_type NOT NULL when species = 'duck')
- `batches`: partial unique index `batches_house_active_uniq ON batches(house_id) WHERE status <> 'terminated' AND house_id IS NOT NULL`
- `houses`: `occupied_by_batch_id UUID REFERENCES batches(id) ON DELETE SET NULL`
- `health_tasks`: 12 new columns (medication_id, delivery_method, container_type_id, container_count, water_volume_l, computed_dose_amount, computed_dose_unit, bird_count, withdrawal_meat_until, withdrawal_eggs_until, cost_pesewas, blocked_reason)
- `egg_sales`: `batch_id UUID REFERENCES batches(id) ON DELETE SET NULL`, plus crate/loose/pesewas columns
- `user_preferences`: `cost_privacy_pin TEXT`, `timezone TEXT`

### Migration 5 — Money conversion

Add new `_pesewas INTEGER` columns alongside existing `NUMERIC` columns, populate with `ROUND(existing_column * 100)::INTEGER`, then drop old columns. Affected: `expenses.amount`, `revenue.amount`, `stock_items.unit_price`, `stock_transactions.unit_price`/`total_cost`, `egg_sales.unit_price`/`total_amount`.

### Migration 6 — New tables

Create with full RLS: `medications`, `container_types`, `ingredients`, `nutritional_requirements`, `config_overrides`, `idempotency_keys`, `stock_lots`, `stock_allocations`.

### Migration 7 — Seed data

Insert 52 medications, 9 container types, 25 ingredients, and nutritional requirements per species/phase using `ON CONFLICT DO NOTHING`.

### Frontend fix — `useStockData.ts` bug

Fix `item_id` → `stock_item_id` in the `stock_transactions` insert payload in file:src/hooks/useStockData.ts line 88.

### TypeScript types update

Update file:src/integrations/supabase/types.ts to reflect all new columns and tables.

## Acceptance Criteria

- All 4 migrations apply cleanly on a fresh Supabase instance
- All 4 migrations are idempotent (re-running does not fail)
- `batches_house_active_uniq` index rejects a second active batch on the same house
- `duck_type_required` CHECK constraint rejects a duck batch without `duck_type`
- `medications` has 52 rows; `container_types` has 9 rows
- `nutritional_requirements` has rows for all species/phase combinations
- All new tables have RLS enabled with correct farm-scoped policies
- `useStockData.ts` `stock_transactions` insert uses `stock_item_id`
- TypeScript types compile without errors

## Dependencies

None — this is the foundation ticket.
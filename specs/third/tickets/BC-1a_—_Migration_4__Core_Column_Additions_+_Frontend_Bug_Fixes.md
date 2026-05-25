# BC-1a — Migration 4: Core Column Additions + Frontend Bug Fixes

## Overview

The first of 5 BC-1 sub-tickets. Adds all missing columns to existing tables via a single additive SQL migration. Also fixes 2 live frontend bugs discovered during cross-validation.

**Sprint:** Sprint 1 (must complete before BC-2, BC-3, BC-4, BC-7, BC-8).

**Spec reference:** spec:e4556d74-53bc-432d-b750-3db37d529bab/f907ab32-46cf-48cf-a173-d28f90d1c466 — BC-1 Migration 4 section.

## Scope

### Migration 4 — Column additions

New SQL file in file:supabase/migrations/. All additions are `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` — safe to re-run.

**`farms`****:** `water_source_chlorinated BOOLEAN NOT NULL DEFAULT false`, `timezone TEXT NOT NULL DEFAULT 'Africa/Accra'`, `currency TEXT NOT NULL DEFAULT 'GHS'`, `egg_low_inventory_crates INTEGER NOT NULL DEFAULT 5`

**`batches`****:** `duck_type TEXT CHECK (duck_type IN ('meat', 'layer'))`, `cycle_length_weeks INTEGER NOT NULL DEFAULT 8`, `has_active_withdrawal BOOLEAN NOT NULL DEFAULT false`, `termination_reason TEXT CHECK (termination_reason IN ('normal', 'emergency'))`, CHECK constraint `duck_type IS NOT NULL WHEN species = 'duck'`, partial unique index `ON batches(house_id) WHERE status <> 'terminated' AND house_id IS NOT NULL`

**`houses`****:** `occupied_by_batch_id UUID REFERENCES batches(id) ON DELETE SET NULL`

**`health_tasks`****:** 12 new columns — `medication_id TEXT`, `delivery_method TEXT DEFAULT 'drinking_water'`, `container_type_id TEXT`, `container_count INTEGER`, `water_volume_l NUMERIC`, `computed_dose_amount NUMERIC`, `computed_dose_unit TEXT`, `bird_count INTEGER`, `withdrawal_meat_until DATE`, `withdrawal_eggs_until DATE`, `cost_pesewas INTEGER`, `blocked_reason TEXT`

**`egg_sales`****:** `batch_id UUID REFERENCES batches(id) ON DELETE SET NULL`, `crates_sold INTEGER NOT NULL DEFAULT 0`, `looses_sold INTEGER NOT NULL DEFAULT 0`, `price_per_crate_pesewas INTEGER NOT NULL DEFAULT 0`, `price_per_loose_pesewas INTEGER NOT NULL DEFAULT 0`, `total_revenue_pesewas INTEGER NOT NULL DEFAULT 0`, `payment_method TEXT NOT NULL DEFAULT 'cash'`, `ledger_entry_id TEXT`

**`user_preferences`****:** `cost_privacy_pin TEXT`, `timezone TEXT`

**`revenue`****:** `source TEXT NOT NULL DEFAULT 'manual'`, `source_ref TEXT`

### Frontend bug fixes

file:src/hooks/useStockData.ts** line 88:** `item_id: itemId` → `stock_item_id: itemId`

file:src/hooks/useStockData.ts** line 92:** `total_amount: price ? qty * price : null` → `total_cost: price ? qty * price : null`

## Acceptance Criteria

1. Migration applies cleanly on a fresh Supabase instance
2. Migration is idempotent (`ADD COLUMN IF NOT EXISTS`)
3. `batches_house_active_uniq` partial index rejects a second active batch on the same house
4. `duck_type_required` CHECK constraint rejects a duck batch without `duck_type`
5. `revenue` table has `source` and `source_ref` columns
6. `useStockData.ts` `stock_transactions` insert uses `stock_item_id` and `total_cost`
7. TypeScript compiles without errors after the hook fixes

## Dependencies

None — this is the first sub-ticket.
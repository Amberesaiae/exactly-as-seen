# BC-1b — Migration 5A: Money Columns Phase A (Add Pesewas Columns)

## Overview

Phase A of the two-phase pesewas migration. Adds `_pesewas INTEGER` columns alongside existing `NUMERIC` money columns and populates them. Old columns are **not dropped** — the existing frontend continues to work during the deployment window.

**Sprint:** Sprint 1 (runs after BC-1a, before frontend hooks are updated to use `_pesewas` names).

**Spec reference:** spec:e4556d74-53bc-432d-b750-3db37d529bab/f907ab32-46cf-48cf-a173-d28f90d1c466 — BC-1 Migration 5A section.

## Scope

### Migration 5A — Add and populate pesewas columns

New SQL file in file:supabase/migrations/. Runs in a single transaction.

For each affected table: `ALTER TABLE ... ADD COLUMN IF NOT EXISTS amount_pesewas INTEGER; UPDATE ... SET amount_pesewas = ROUND(amount * 100)::INTEGER;`

**Affected columns:**

- `expenses.amount` → add `expenses.amount_pesewas INTEGER`
- `revenue.amount` → add `revenue.amount_pesewas INTEGER`
- `stock_items.unit_price` → add `stock_items.unit_price_pesewas INTEGER`
- `stock_transactions.unit_price` → add `stock_transactions.unit_price_pesewas INTEGER`
- `stock_transactions.total_cost` → add `stock_transactions.total_cost_pesewas INTEGER`
- `feed_ingredients.unit_price` → add `feed_ingredients.unit_price_pesewas INTEGER`
- `feed_ingredients.total_cost` → add `feed_ingredients.total_cost_pesewas INTEGER`

Note: `egg_sales` money columns are handled by the new columns added in BC-1a (`price_per_crate_pesewas`, `total_revenue_pesewas`) — no additional columns needed here.

**Phase B (drop old columns) is a separate migration** — ticket:e4556d74-53bc-432d-b750-3db37d529bab/BC-1e — and must only run after all frontend hooks are updated to use `_pesewas` column names.

## Acceptance Criteria

1. Migration applies cleanly and is idempotent
2. All `_pesewas` columns exist and are populated: `ROUND(old_column * 100)::INTEGER`
3. Old NUMERIC columns still exist — existing frontend continues to work
4. Existing data integrity: `expenses.amount_pesewas = ROUND(expenses.amount * 100)` for all rows
5. Migration runs in a single transaction — rolls back entirely on any failure

## Dependencies

BC-1a (Migration 4 must be applied first).
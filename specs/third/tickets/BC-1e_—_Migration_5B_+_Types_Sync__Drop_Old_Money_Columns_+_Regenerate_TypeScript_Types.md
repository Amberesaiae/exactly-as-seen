# BC-1e — Migration 5B + Types Sync: Drop Old Money Columns + Regenerate TypeScript Types

## Overview

Phase B of the two-phase pesewas migration. Drops the old NUMERIC money columns after all frontend hooks have been updated to use `_pesewas` column names. Also regenerates file:src/integrations/supabase/types.ts to reflect the complete updated schema.

**Sprint:** Sprint 2 (must run after all frontend hooks in BC-4 are updated to use `_pesewas` names, and after BC-1a through BC-1d are complete).

**Spec reference:** spec:e4556d74-53bc-432d-b750-3db37d529bab/f907ab32-46cf-48cf-a173-d28f90d1c466 — BC-1 Migration 5B section.

## Scope

### Migration 5B — Drop old NUMERIC columns

New SQL file in file:supabase/migrations/. **Must only run after the frontend is deployed with ****`_pesewas`**** column names.**

Drops: `expenses.amount`, `revenue.amount`, `stock_items.unit_price`, `stock_transactions.unit_price`, `stock_transactions.total_cost`, `feed_ingredients.unit_price`, `feed_ingredients.total_cost`.

### TypeScript types regeneration

After all BC-1a through BC-1d migrations are applied (and before 5B), run `supabase gen types typescript --local > src/integrations/supabase/types.ts` to regenerate the types file reflecting all new columns and tables.

Verify all hooks compile without TypeScript errors after the type update:

- file:src/hooks/useHealthData.ts
- file:src/hooks/useStockData.ts
- file:src/hooks/useFinanceData.ts
- file:src/hooks/useEggData.ts
- file:src/hooks/useRecordsPerformance.ts

## Acceptance Criteria

1. Old NUMERIC money columns dropped from all affected tables
2. `_pesewas` columns remain and contain correct data
3. `types.ts` reflects all new columns and tables from BC-1a through BC-1d
4. All hooks compile without TypeScript errors
5. App runs without runtime errors after column drop
6. **Pre-condition verified:** All frontend hooks use `_pesewas` column names before this migration runs

## Dependencies

BC-1a, BC-1b, BC-1c, BC-1d (all prior BC-1 sub-tickets), BC-4 (frontend hooks updated to use `_pesewas` names).
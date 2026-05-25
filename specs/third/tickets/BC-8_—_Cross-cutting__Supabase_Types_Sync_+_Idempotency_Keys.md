# BC-8 — Cross-cutting: Supabase Types Sync + Idempotency Keys

## Overview

Two cross-cutting concerns that must be addressed after all schema migrations are applied: regenerating the TypeScript types from the updated Supabase schema, and implementing client-side idempotency key generation for all write operations.

## Scope

### TypeScript types regeneration

After BC-1 migrations are applied, regenerate file:src/integrations/supabase/types.ts using `supabase gen types typescript`. The regenerated file must reflect all new columns and tables from M1.

Verify that all hooks compile without TypeScript errors after the type update.

### Idempotency key generation

Add a utility `src/lib/idempotency.ts` that generates UUIDv7 idempotency keys for all write operations. The key is stored in `idempotency_keys` table with `expires_at = NOW() + 24 hours`.

All write operations in the following hooks must include an idempotency key:

- `useHealthData.ts` — `addMedication`, `markTaskComplete`
- `useEggData.ts` — `recordCollection`, `recordSale`
- `useStockData.ts` — `addStockItem`, `recordTransaction`
- `useFinanceData.ts` — `addExpense`, `addRevenue`

The key is passed as a custom header or included in the insert payload's `source_ref` field for deduplication.

### `sync.ts` — delta sync cursor

Update file:src/lib/sync.ts to write `last_synced_at` to the `sync_meta` Dexie table after each successful Supabase pull. This enables future delta sync (only pull rows changed since the cursor).

## Acceptance Criteria

- `types.ts` reflects all new columns and tables from M1
- All hooks compile without TypeScript errors
- `idempotency.ts` generates UUIDv7 keys
- All write operations include idempotency keys
- `sync.ts` writes `last_synced_at` to `sync_meta` after each successful pull

## Dependencies

BC-1 (all schema migrations applied)
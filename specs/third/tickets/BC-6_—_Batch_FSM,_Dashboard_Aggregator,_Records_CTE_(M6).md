# BC-6 — Batch FSM, Dashboard Aggregator, Records CTE (M6)

## Overview

Implement the XState v5 batch FSM with withdrawal guard, the Dashboard Postgres aggregator function, and the Records CTE Postgres function.

**Spec reference:** spec:e4556d74-53bc-432d-b750-3db37d529bab/`[M6 spec id]`

## Scope

### Batch FSM — `src/lib/batch-fsm.ts`

Implement XState v5 machine with 8 states and all guards per `specs/02_BATCH_MANAGEMENT.md` §4. Key guard: `TERMINATE_NORMAL` not defined from `withdrawal` state.

Update file:src/pages/BatchDetail.tsx:

- Terminate button checks `batch.has_active_withdrawal` before calling FSM
- If true: show blocking dialog `"Cannot terminate batch during active withdrawal period. Emergency terminate is still available."`
- Emergency terminate always allowed
- On batch creation: set `houses.occupied_by_batch_id = batch.id`
- On termination: set `houses.occupied_by_batch_id = null`

Update file:src/pages/BatchCreate.tsx:

- Disable house selection for houses where `occupied_by_batch_id IS NOT NULL`
- Show `"Occupied"` badge on occupied houses

### Dashboard — Postgres function

Create Supabase Postgres function `get_dashboard_overview(p_farm_id UUID)` returning JSONB with the `DashboardOverview` shape from `specs/09_MAIN_DASHBOARD.md` §2.

Update file:src/pages/Dashboard.tsx:

- Replace multiple parallel Supabase queries with single `supabase.rpc('get_dashboard_overview', { p_farm_id: farmId })`
- Cache result in Dexie `dashboard_cache` with `fetched_at` timestamp
- Serve from cache when offline; show staleness indicator when cache age > 1h

### Records — Postgres function

Create Supabase Postgres function `get_batch_record_summary(p_farm_id UUID, p_batch_ids UUID[])` implementing the CTE from `specs/08_RECORDS.md` §5.3.

Update file:src/hooks/useRecordsPerformance.ts:

- Replace 6 parallel queries with single `supabase.rpc('get_batch_record_summary', { p_farm_id, p_batch_ids })`

## Acceptance Criteria

- `TERMINATE_NORMAL` blocked (toast shown) when `has_active_withdrawal = true`
- `EMERGENCY_TERMINATE` always succeeds
- Phase transitions correct for all species
- `houses.occupied_by_batch_id` set on creation, cleared on termination
- Batch wizard disables occupied houses
- `get_dashboard_overview` returns correct shape; Dashboard uses single RPC call
- Dashboard result cached in Dexie; offline load serves from cache
- `get_batch_record_summary` returns correct aggregates; `useRecordsPerformance` uses single RPC call

## Dependencies

BC-1 (schema — `batches.has_active_withdrawal`, `batches.duck_type`, `houses.occupied_by_batch_id`), BC-2 (withdrawal state management), BC-4 (egg inventory for records)
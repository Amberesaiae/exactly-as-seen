# R3 — Remaining Sprint 0 Fixes: batch-utils mortality endpoint + duck-niacin alert text

## Goal

Two Sprint 0.3 items were missed in the previous implementation pass. Both are small, targeted fixes.

## Spec Reference

spec:3a092065-e868-4799-849c-f707a0553261/b7f8a421-4897-4bc3-bfc4-850e84f63a24 — Sprint 0 §0.3

## Changes Required

### 1. `recordMortality()` — file:artifacts/lampfarms/src/lib/batch-utils.ts

Replace the three `supabase.from(...)` calls in `recordMortality()` with a single `fetch('POST /api/v1/batches/:id/mortality', ...)`. The spec-compliant endpoint already exists and handles population decrement + outbox event atomically. The supabase shim path bypasses the FSM and the outbox.

Also replace `cleanupBatchCompletion()` supabase calls with direct calls to the spec-compliant health task skip endpoint or remove the function if it is no longer called anywhere.

### 2. Duck-niacin alert text — file:artifacts/lampfarms/src/lib/health-data.ts

The `duck-niacin` alert in `SPECIES_HEALTH_ALERTS` currently says:

<user_quoted_section>"Add 100–150 mg niacin per gallon of drinking water or use niacin-fortified feed to prevent leg problems."</user_quoted_section>

Remove the "or use niacin-fortified feed" clause. Niacin is Water-Health only (CONVENTIONS §2.9). The alert itself is kept — it surfaces the niacin requirement to the farmer — but the feed reference is removed.

## Acceptance Criteria

- `recordMortality()` calls `POST /api/v1/batches/:id/mortality` — no supabase calls remain in `batch-utils.ts`
- `cleanupBatchCompletion()` has no supabase calls
- Duck-niacin alert description contains no reference to feed
- `pnpm run typecheck` passes
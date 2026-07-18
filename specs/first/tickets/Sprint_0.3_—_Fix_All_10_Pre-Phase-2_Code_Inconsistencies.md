# Sprint 0.3 — Fix All 10 Pre-Phase-2 Code Inconsistencies

## Goal

Fix all 10 selected inconsistencies in the frontend codebase before Phase 2 work begins. These are correctness issues that would produce wrong behaviour in Phase 2 if left unfixed.

## Changes Required

### 1. Duck niacin removed from feed — file:artifacts/lampfarms/src/lib/feed-data.ts

- Delete the `niacin_duck` entry from `SAFETY_RULES` array (lines 132–140)
- Remove the duck niacin block from `getCompulsorySupplements()` (lines 209–215)
- Remove `{ name: 'Niacin (Vitamin B3)', ... }` from `INGREDIENTS` array (line 68)
- Niacin is Water-Health only per CONVENTIONS §2.9

### 2. Phase boundaries aligned — file:artifacts/lampfarms/src/lib/batch-utils.ts

- Fix `PHASE_DEFINITIONS.broiler` starter phase: change `weekEnd: 2` to `weekEnd: 3`
- This matches the FSM in file:artifacts/api-server/src/modules/batch/fsm.ts (`PHASE_BOUNDARIES.broiler.starter = 3`)

### 3. Broiler vaccination templates corrected — file:artifacts/lampfarms/src/lib/health-data.ts

- Replace the generic broiler vaccination entries in `VACCINATION_TEMPLATES` with the 5 canonical events per CONVENTIONS §2.8:
  - Day 7: Gumboro Intermediate (drinking_water)
  - Day 14: HB1 Newcastle + IB (drinking_water)
  - Day 21: Gumboro Intermediate Plus (drinking_water)
  - Day 28: Lasota (drinking_water)
  - Day 35: Gumboro Intermediate Plus (drinking_water)

### 4. Dexie schema extended — file:artifacts/lampfarms/src/lib/db.ts

- Add `sync_meta` table: `'entity, last_synced_at, server_version'`
- Add `conflicts` table: `'++id, entity, record_id, detected_at'`
- Add `dashboard_cache` table: `'farm_id, payload, fetched_at'`
- Bump Dexie version to 2

### 5. Sync uses delta endpoint — file:artifacts/lampfarms/src/lib/sync.ts

- Replace `supabase.from('farms').select(...)` etc. with `fetch('/api/sync/delta?entity=farms&since=...')`
- Keep the current outbox limited to the existing Phase 1 write flows; do **not** attempt generic replay of Phase 2+ command-style endpoints in this ticket
- Use `sync_meta` Dexie table to track `last_synced_at` per entity
- Document that Phase 2+ writes are online-only until a command-intent outbox exists

### 6. Records.tsx — remove client-side aggregation

- Remove the 5-parallel-Supabase-query block in file:artifacts/lampfarms/src/pages/Records.tsx
- Replace with a call to `GET /api/v1/records/batches` (stub — returns empty until Phase 4 backend is built)
- Show a "Records analytics coming soon" placeholder for the Performance and Compare tabs

### 7. Records.tsx — remove client-side cost privacy masking

- Remove the `mask()` function and all `mask(v)` calls
- Financial values are either returned by the server (unmasked) or not returned (masked) — the client never decides

### 8. Settings currencies — GHS/NGN only — file:artifacts/lampfarms/src/pages/SettingsPage.tsx

- Change `CURRENCIES` constant from `['GHS', 'USD', 'EUR', 'GBP', 'NGN']` to `['GHS', 'NGN']`
- Update any currency selector UI to show only these two options

### 9. Settings — remove password change UI — file:artifacts/lampfarms/src/pages/SettingsPage.tsx

- Remove the password change dialog and all related state (`passwordData`, `showPassword*`, etc.)
- Remove `PasswordStrengthIndicator` usage
- Remove the "Change Password" button from the Account tab
- Add a note: "Password management is handled by your sign-in provider"

## Acceptance Criteria

pnpm run typecheck passes with zero errors after all changesDuck batch feed formulation contains no niacin lineBroiler batch shows 5 vaccinations in health databatch-utils.ts broiler starter phase ends at Week 3Dexie opens at version 2 with sync_meta, conflicts, dashboard_cache tablessync.ts makes no direct Supabase calls for reads (uses delta endpoint)Phase 2+ write flows are not replayed through the old generic outboxSettings page shows only GHS and NGN in currency selectorSettings page has no password change dialogRecords page shows no client-side financial masking
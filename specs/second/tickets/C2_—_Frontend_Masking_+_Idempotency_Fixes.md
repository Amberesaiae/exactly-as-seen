# C2 — Frontend Masking + Idempotency Fixes

## Scope

Fix the remaining frontend correctness issues: Eggs page masking from wrong source, `batch-utils.ts` wrong terminate body and missing idempotency key.

### Included

file:artifacts/lampfarms/src/pages/Eggs.tsx**:**

- Line 180: `masked={costPrivacyEnabled}` — replace with masking derived from whether the server returned `null` for revenue values in the sales response
- The `SalesTable` component receives `masked` as a prop. The correct value is: `masked = sales.some(s => (s as { totalRevenuePesewas?: number | null }).totalRevenuePesewas === null)` — i.e. if the server returned `null` for any revenue field, the table is masked

file:artifacts/lampfarms/src/lib/batch-utils.ts**:**

- Line 89 in `cleanupBatchCompletion`: `body: JSON.stringify({ reason: 'normal' })` → `body: JSON.stringify({ mode: 'normal' })` — the terminate endpoint's Zod schema requires `mode`, not `reason`
- Line 75 in `recordMortality`: add `'Idempotency-Key': crypto.randomUUID()` to the headers — the idempotency middleware returns `400 IDEMPOTENCY_KEY_REQUIRED` for write requests without this header

### Explicitly out

- Backend changes
- Changes to the Finance page (already correct — derives `masked` from server `null` values)
- Changes to the Dashboard page (already correct — derives masking from `cost_privacy_enabled` in server response)

## Acceptance criteria

- `Eggs.tsx` `SalesTable` shows `••••` for revenue values when the server returns `null` — not when the Zustand store says `costPrivacyEnabled = true`
- `cleanupBatchCompletion` sends `{ mode: 'normal' }` — the terminate endpoint accepts it without a Zod validation error
- `recordMortality` includes `Idempotency-Key` header — the idempotency middleware does not return `400`
- No page derives masking from the Zustand `costPrivacyEnabled` store for display decisions

## Dependencies

Depends on A2 (egg transactions must be correct before testing egg sales masking) and C1 (response shape fixes must land first so the sales response shape is known).

## Plan reference

spec:3a092065-e868-4799-849c-f707a0553261/ecd0ec8f-4fe6-44c2-afee-fa2592de59b8 — issues 6, 26, 33.
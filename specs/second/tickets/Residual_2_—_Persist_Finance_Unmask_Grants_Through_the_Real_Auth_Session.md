# Residual 2 — Persist Finance Unmask Grants Through the Real Auth Session

## Scope

Move Finance privacy unmask grants from a transient request-only object to the real auth/session mechanism.

### Included

- Replace transient `req.session`-style grant storage in file:artifacts/api-server/src/modules/finance/privacy.ts
- Persist the grant through the actual auth/session model used by file:artifacts/api-server/src/lib/auth.ts
- Ensure the TTL survives across requests for the intended duration
- Re-check Finance, Dashboard, and Records privacy behavior against one canonical server-side rule

### Explicitly out

- Changes to the privacy product rule itself
- New privacy UI flows

## Why this ticket exists

The current code grants unmask access on a transient object attached to the request, not on the real DB-backed auth session. That means the grant does not reliably survive the next request, which breaks the intended privacy workflow.

## Plan references

- spec:3a092065-e868-4799-849c-f707a0553261/b7f8a421-4897-4bc3-bfc4-850e84f63a24 — **Current Canonical State**
- spec:3a092065-e868-4799-849c-f707a0553261/b7f8a421-4897-4bc3-bfc4-850e84f63a24 — **Sprint 2B — Finance Module Backend**
- spec:3a092065-e868-4799-849c-f707a0553261/b7f8a421-4897-4bc3-bfc4-850e84f63a24 — **Sprint 4 — Dashboard Aggregator Backend**
- file:artifacts/api-server/src/modules/finance/privacy.ts
- file:artifacts/api-server/src/modules/finance/service.ts
- file:artifacts/api-server/src/lib/auth.ts

## Dependencies

- Depends on the PIN alignment ticket above, because the grant path should be validated end-to-end after PIN verification is correct

## Acceptance criteria

- Unmask grants persist across requests for the configured TTL
- Finance endpoints honor the active grant correctly
- Dashboard and Records remain aligned with the same server-side privacy rule
- Expired grants return the user to masked responses without client-side masking hacks
- The implementation uses the real auth/session source of truth, not a transient request-local field
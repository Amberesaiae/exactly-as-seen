# Residual 1 — Align Finance PIN Verification with bcrypt-Hashed Settings PIN

## Scope

Fix the mismatch between how the privacy PIN is stored and how it is verified during unmask.

### Included

- Align Finance unmask PIN verification with the bcrypt-hashed PIN written by Settings
- Ensure the Finance unmask flow uses the same canonical credential model as file:artifacts/api-server/src/modules/settings/routes.ts
- Validate the end-to-end behavior across:
  - file:artifacts/api-server/src/modules/settings/routes.ts
  - file:artifacts/api-server/src/modules/finance/service.ts

### Explicitly out

- Session persistence of the unmask grant itself
- UI redesign of the Finance or Settings pages

## Why this ticket exists

The current implementation hashes PINs with bcrypt in Settings, but the Finance unmask flow still compares the submitted PIN as plaintext against the stored value. That breaks the privacy-unmask path even when the rest of the module is implemented.

## Plan references

- spec:3a092065-e868-4799-849c-f707a0553261/b7f8a421-4897-4bc3-bfc4-850e84f63a24 — **Current Canonical State**
- spec:3a092065-e868-4799-849c-f707a0553261/b7f8a421-4897-4bc3-bfc4-850e84f63a24 — **Sprint 2B — Finance Module Backend**
- file:artifacts/api-server/src/modules/settings/routes.ts
- file:artifacts/api-server/src/modules/finance/service.ts

## Dependencies

None.

## Acceptance criteria

- The Finance unmask flow verifies PINs against the stored bcrypt hash
- A PIN set through the Settings module can be used successfully by the Finance unmask endpoint
- Incorrect PINs are rejected with the existing canonical error behavior
- No plaintext PIN comparison remains in the Finance path
- The change does not weaken the existing Settings PIN behavior
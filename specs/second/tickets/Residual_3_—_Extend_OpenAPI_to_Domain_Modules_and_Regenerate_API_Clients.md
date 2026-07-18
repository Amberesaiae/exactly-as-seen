# Residual 3 — Extend OpenAPI to Domain Modules and Regenerate API Clients

## Scope

Bring the API spec and generated clients up to date with the implemented domain modules.

### Included

- Extend file:lib/api-spec/openapi.yaml beyond auth to cover the implemented domain modules
- Regenerate:
  - file:lib/api-client-react/src/generated/
  - file:lib/api-zod/src/generated/
- Align generated contracts with the already-implemented routes mounted in file:artifacts/api-server/src/routes/index.ts

### Explicitly out

- Rewriting working frontend pages to fully adopt generated clients in the same ticket
- Changing implemented API behavior solely to match old generated artifacts

## Why this ticket exists

The application already has broad domain implementation, but the OpenAPI layer still reflects an earlier state where only auth endpoints were described. That creates a tooling/documentation gap and blocks accurate client generation.

## Plan references

- spec:3a092065-e868-4799-849c-f707a0553261/b7f8a421-4897-4bc3-bfc4-850e84f63a24 — **Current Canonical State**
- spec:3a092065-e868-4799-849c-f707a0553261/b7f8a421-4897-4bc3-bfc4-850e84f63a24 — **Sprint 4.8 Ops Hardening**
- file:lib/api-spec/openapi.yaml
- file:lib/api-spec/orval.config.ts
- file:artifacts/api-server/src/routes/index.ts

## Dependencies

None.

## Acceptance criteria

- OpenAPI describes the implemented domain modules, not just auth
- Generated React client artifacts and Zod artifacts regenerate successfully
- The generated contracts match the mounted API surface closely enough to be trusted as canonical tooling output
- No auth-only mismatch remains between the codebase and the generated client layer
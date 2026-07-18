# Residual 4 — Add Rate Limiting to Auth and Mutating API Endpoints

## Scope

Implement the remaining API abuse-hardening guardrails.

### Included

- Add rate limiting to auth endpoints
- Add rate limiting to mutating API endpoints, including legacy routes while they remain mounted
- Apply the guardrails in file:artifacts/api-server/src/app.ts
- Keep the rules compatible with the existing authenticated API shape and local-dev workflow

### Explicitly out

- Broader WAF / infrastructure-level protections
- Changes to product business logic

## Why this ticket exists

The platform is functionally complete, but the plan still calls for rate limiting as part of final ops hardening. This is now one of the few remaining cross-cutting gaps.

## Plan references

- spec:3a092065-e868-4799-849c-f707a0553261/b7f8a421-4897-4bc3-bfc4-850e84f63a24 — **Current Canonical State**
- spec:3a092065-e868-4799-849c-f707a0553261/b7f8a421-4897-4bc3-bfc4-850e84f63a24 — **Sprint 4.8 Ops Hardening**
- file:artifacts/api-server/src/app.ts

## Dependencies

None.

## Acceptance criteria

- Auth endpoints are rate limited
- Mutating API endpoints, including legacy routes while they remain mounted, are rate limited
- Read-only endpoints are not accidentally degraded by the same policy
- Local development remains usable
- The rate limiting policy is explicit and centralized enough to remain maintainable
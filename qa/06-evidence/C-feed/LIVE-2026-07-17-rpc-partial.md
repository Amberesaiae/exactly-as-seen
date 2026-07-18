# Live RPC acid (partial) — 2026-07-17

## Result: AUTH BLOCKED

| Field | Value |
|-------|-------|
| Environment | Hosted Supabase via `VITE_SUPABASE_URL` (anon key only) |
| Attempt | `signUp` + `signInWithPassword` for ephemeral QA user |
| Error | `Email not confirmed` |
| LIVE_AUDIT_EMAIL / PASS | not set in process env |
| SUPABASE_SERVICE_ROLE_KEY | not available |

## Implication

Cannot complete triple-proof greys (UI + network + DB) without a **pre-confirmed** farmer account:

```bash
export LIVE_AUDIT_EMAIL='…'   # pre-confirmed on hosted project
export LIVE_AUDIT_PASS='…'
# then re-run focused RPC script / live-audit-thorough / headed UI
```

## What this session *did* prove (not live)

| Layer | Status |
|-------|--------|
| Code inventory | Complete — `AUDIT.md` §2 |
| K1 FE kill | Grep clean + contract test |
| K2 FE kill | Grep clean + contract test |
| Book now Health lie | Fixed to expense-only |
| Hosted RPC happy paths | **Not re-run this session** |
| UI network HAR | **Not run** |

## Greys remaining

All C-F-U01–U27 stay **GREY** until live matrix with confirmed credentials.

Pack status remains **ACID_IN_PROGRESS** — not CURATED/CLOSED.

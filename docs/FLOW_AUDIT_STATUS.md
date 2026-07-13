# Flow audit status (canonical journeys)

**Branch:** `feat/canonical-journeys`  
**PR:** https://github.com/Amberesaiae/exactly-as-seen/pull/3  
**Updated:** 2026-07-12  

Method: offline e2e code-path audit + Vitest mocks first; live Supabase/Docker is **optional residual**, not a unit gate.  
See `docs/AUDIT_WITHOUT_BACKEND.md`, `docs/CANONICAL_JOURNEYS.md`.

---

## Done this session

### Product / stack docs
- Field-ledger landing (Welcome, Platform, Solutions, Impact, Resources)
- Zero-admin WSL Docker Engine path (`docs/NO_ADMIN_STACK.md`, stack scripts)
- Dual-pattern foundation (`ledger-policy`, water dual gate)

### Flow A — Onboard (code + tests)
| Item | Change |
|---|---|
| Farm finish atomicity | `FarmSetup.handleFinish`: identity → houses → **then** `setup_complete: true` → prefs → activity |
| Farm pick | `AuthContext` + `FarmSetup` use `selectPrimaryFarm` from `canonical.ts` |
| Route gates | Covered in `src/test/flow-a-onboarding.test.tsx` |
| Auth writers | Existing `src/test/auth.test.tsx` (mocked Supabase) |
| Env helper | `stack-env.ps1`: UTF-8 **no BOM** (Supabase CLI rejects BOM); eth0 WSL IP |

### Offline green (subset)
```
bun run test -- src/test/flow-a-onboarding.test.tsx src/test/auth.test.tsx \
  src/test/production-system.test.ts src/test/synergy-pattern.test.ts \
  src/test/preferences.test.ts src/test/batch-fsm.test.ts \
  src/test/medication-conflicts.test.ts src/test/example.test.ts
```
→ **38 passed** (last run).

---

## Not done / residual

### Live stack
- WSL Docker Engine may start; Supabase containers often **unhealthy** on low-RAM WSL.
- `.env.local` must use WSL eth0 IP (not `localhost:54321`) when Engine path is used.
- Live register → farm-setup → dashboard smoke: **deferred**.

### Red unit suites (implementation drift — fix next, not test-only)
| Suite | Symptom | Real fix target |
|---|---|---|
| `health-auto-tasks` | Missing glucose / daily niacin / amprolium / multivitamins | Restore full species protocols in `generateAutoTasks` (Flow B seed) |
| `feed-safety` | R-FC-1..5 not applied (auto toxin binder, gossypol code, fish cap warn, single calcium, duck strips free niacin line) | Rewrite `preprocessFormulation` to match research rules + tests |
| `feed-lp` | `usageLimits` undefined on test Ingredient shape; WASM mock fragile | Normalize ingredient bounds helper; harden fallback path |

### Flows B–K
Contract rows exist in `CANONICAL_JOURNEYS.md`. **Not yet code-audited/fixed end-to-end** in this commit. Next work should start with Flow B (`BatchCreate` + `generateAutoTasks` seed) after health protocol fix.

---

## How to continue without Docker

```powershell
cd C:\src\exactly-as-seen
bun install
bun run test
# Fix implementation until full suite is green; one flow at a time.
```

When stack is healthy: `bun run stack:up` → `bun run stack:env` → `bun run frontend` → manual Flow A smoke.

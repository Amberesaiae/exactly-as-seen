# LampFarms Canonical Journeys — Complete Local Project Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax for tracking. Per task: superpowers:test-driven-development. Before claiming done: superpowers:verification-before-completion.

**Goal:** Ship a complete local LampFarms project (Supabase backend + React frontend) where every primary user journey (A–K) is audited, fixed, verified, and working end-to-end under canonical dual-pattern and atomic ledger rules — without daily admin PowerShell.

**Architecture:** Supabase-first (Postgres + RLS + RPC + Edge). Client domain in `src/lib/*` + hooks. One intent → one writer → dual consumption gate via `shouldAutoLedger()`. Journey contract: `docs/CANONICAL_JOURNEYS.md`. Runtime enums: `docs/CANONICAL_RUNTIME.md` + `src/lib/canonical.ts`. Research domain only from `deprecated specs/`.

**Tech Stack:** React 18, Vite, Supabase CLI (`npx`), Docker Desktop (user-mode), Vitest, TypeScript.

**Working copy:** `C:\src\exactly-as-seen` (writable; avoid `D:\` junctions for agents).

---

## Operating rules

1. **One flow at a time.** Do not start flow N+1 until flow N acceptance is green.
2. **TDD** for pure domain logic (production-system, conflicts, egg eligibility, double-ledger helpers).
3. **First principles:** gate order Auth → farm → batch → eligibility → safety → dual ledger → write.
4. **No daily admin PowerShell.** No `Start-Process -Verb RunAs`. Use `npm run backend|frontend|db:reset`.
5. **Commit** after each completed phase/flow (user-approved commits if policy requires).
6. Prefer **feature branch** `feat/canonical-journeys` (do not force-push main without ask).

---

## File map

| Path | Role |
|---|---|
| `docs/CANONICAL_JOURNEYS.md` | Journey contract (this work’s product SoT) |
| `docs/CANONICAL_RUNTIME.md` | Enums, money, dual pattern |
| `docs/BACKEND_LOCAL.md` | Local stack without admin |
| `docs/RESEARCH_RUNTIME_MAPPING.md` | Research → code map |
| `scripts/dev-backend.ps1` | User-mode Supabase start |
| `scripts/dev-frontend.ps1` | User-mode Vite |
| `scripts/sync-env-from-supabase.ps1` | Write `.env.local` from `supabase status` (new) |
| `package.json` | `backend`, `frontend`, `db:reset`, `stack:status` scripts |
| `src/lib/canonical.ts` | LEDGER_SOURCES, money, farm pick |
| `src/lib/production-system.ts` | `shouldAutoLedger` |
| `src/lib/synergy.ts` | Auto expense/revenue/stock |
| `src/lib/medication-conflicts.ts` | C1–C8 |
| `src/lib/health-auto-tasks.ts` | Batch seed tasks |
| Hooks / pages per flow table below | Writers + UI |

---

## Phase 0 — Complete local project (no admin)

**Goal:** Backend + frontend installable and runnable as normal user.

### Task 0.1 — npm scripts + no-elevation scripts

**Files:**
- Modify: `package.json`
- Modify: `scripts/dev-backend.ps1`
- Create: `scripts/sync-env-from-supabase.ps1`
- Modify: `docs/BACKEND_LOCAL.md` (point to npm scripts)

- [ ] **Step 1:** Add scripts (exact):

```json
"backend": "powershell -NoProfile -ExecutionPolicy Bypass -File ./scripts/dev-backend.ps1",
"frontend": "powershell -NoProfile -ExecutionPolicy Bypass -File ./scripts/dev-frontend.ps1",
"db:reset": "npx --yes supabase db reset",
"db:status": "npx --yes supabase status",
"stack:env": "powershell -NoProfile -ExecutionPolicy Bypass -File ./scripts/sync-env-from-supabase.ps1"
```

- [ ] **Step 2:** Ensure `dev-backend.ps1` never uses `-Verb RunAs` / elevation. Only Start-Process Docker Desktop without elevation.
- [ ] **Step 3:** `sync-env-from-supabase.ps1` parses `npx supabase status -o env` (or status text) and writes/updates `.env.local` `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY`.
- [ ] **Step 4:** Document: daily loop is `npm run backend` once, `npm run stack:env`, `npm run db:reset` once, `npm run frontend`.

### Task 0.2 — Start Docker + Supabase (user-mode)

- [ ] **Step 1:** Confirm Docker Desktop installed (`Test-Path "$env:ProgramFiles\Docker\Docker\Docker Desktop.exe"`).
- [ ] **Step 2:** Start engine without admin: `Start-Process` Docker Desktop; wait for `\\.\pipe\docker_engine`.
- [ ] **Step 3:** `npm run backend` (or `npx supabase start`).
- [ ] **Step 4:** `npm run stack:env` → `.env.local` filled.
- [ ] **Step 5:** `npm run db:reset` — all migrations including `20260711000000_contract_alignment.sql`.
- [ ] **Step 6:** Smoke: open Studio URL from status; or `curl`/fetch auth health.

**Acceptance:** `npx supabase status` shows API URL; `.env.local` has real anon key; db reset succeeds.

### Task 0.3 — Frontend install + boot

- [ ] **Step 1:** `npm install` if needed.
- [ ] **Step 2:** `npm test` baseline (record failures if pre-existing).
- [ ] **Step 3:** `npm run dev` boots; hits local Supabase without console hard errors on load.

**Acceptance:** Vite serves app; login page loads against local API.

---

## Phase 1 — Foundation (before any flow polish)

### Task 1.1 — Dual pattern helper is the only consumption gate

**Files:**
- Modify consumption call sites to use **only** `shouldAutoLedger` (alias ok via re-export).
- Create: `src/test/synergy-pattern.test.ts` (if missing) covering intensive vs flexible for feed/health/water rules as pure functions.

Pure helper to extract if needed:

```ts
// src/lib/ledger-policy.ts
export function shouldExpenseConsumption(system: ProductionSystem): boolean {
  return shouldAutoLedger(system);
}
export function shouldExpensePurchase(): boolean {
  return true;
}
export function shouldRevenueSale(): boolean {
  return true;
}
```

- [ ] RED: tests for purchase always true, consumption follows system.
- [ ] GREEN: implement helper + wire water path to gate.
- [ ] Verify: `npm test -- src/test/synergy-pattern.test.ts`

### Task 1.2 — Single farmId

- [ ] Stock, Finance, Eggs hooks use `useAuth().farmId` (no re-query `selectPrimaryFarm` for primary).

### Task 1.3 — Align CONVENTIONS note for C6/C7

- [ ] Add one-line note in `specs/00_CONVENTIONS.md` or `CANONICAL_RUNTIME` already states WARN — ensure journeys doc is sole severity SoT (already in CANONICAL_JOURNEYS).

**Acceptance Phase 1:** All consumption paths grep for `shouldAutoLedger` or helper; water gated; farmId unified; tests green.

---

## Flows (strict order A→K)

### Flow A — Onboarding

**Files:** `AuthContext.tsx`, `ProtectedRoute.tsx`, `FarmSetup.tsx`, `Register.tsx`, `Login.tsx`, `src/test/auth.test.tsx`

**Audit checklist:**
- [ ] Anonymous → `/welcome` or login
- [ ] Authenticated + `setup_complete=false` → `/farm-setup`
- [ ] Setup complete → cannot stay on wizard → dashboard
- [ ] Sign-up creates farm row with `setup_complete=false`

**Fix only gaps.** Verify: auth tests + manual register → setup → dashboard on local Supabase.

**Acceptance:** Full path works offline-of-cloud on local stack.

---

### Flow B — Batch create

**Files:** `useBatchCreateLogic.ts`, `health-auto-tasks.ts`, `health-data.ts`, BatchCreate UI

**Audit:**
- [ ] Duck requires `duck_type`
- [ ] Broiler/layer forced intensive systems
- [ ] Seeds **5** broiler vaccines from templates
- [ ] House occupation
- [ ] No ledger on create

**TDD:** `generateAutoTasks` broiler count = 5; duck without type rejected in validate.

**Acceptance:** Create broiler → health tasks appear; duck meat no eggs path later.

---

### Flow C — Daily ops

**Files:** `useHealthData.ts`, `useWaterLogic.ts`, Feed/Health/Dashboard

**Audit:**
- [ ] Day feed always writes `feed_logs` unique (batch, date)
- [ ] Intensive stock+expense; flexible log-only message
- [ ] Water expense only if rate **and** `shouldAutoLedger`
- [ ] batch_tasks completion links to writers

**Acceptance:** Intensive day feed creates one expense with `source_ref` day-feed key; flexible does not.

---

### Flow D — Care complete

**Files:** `useMedicationLogic.ts`, `medication-conflicts.ts`, vaccination logic

**Audit:**
- [ ] Conflicts on **add** and **complete**
- [ ] BLOCK disables complete; WARN needs ack
- [ ] Withdrawal updates batch
- [ ] Intensive ledger only
- [ ] C6/C7 WARN

**Acceptance:** Conflict tests green; complete with antibiotic+enro blocked.

---

### Flow E — Feed formulation

**Files:** ReadyMade, Custom, Concentrate

**Audit:**
- [ ] Ready-made treated as **purchase** (always expense if cost > 0)
- [ ] Custom/concentrate consumption: `shouldAutoLedger`
- [ ] Flexible: no dead-end toast (Book now or clear next step)
- [ ] Document double-ledger with day feed

**Acceptance:** Intensive custom deducts stock; flexible does not expense consumption.

---

### Flow F — Stock

**Files:** `useStockData.ts`, FIFO RPC

**Audit:**
- [ ] Purchase → lot + always expense `auto:stock`
- [ ] Usage → FIFO allocate
- [ ] Quality default A

**Acceptance:** Purchase creates expense with `source_ref` = tx id.

---

### Flow G — Eggs

**Files:** `useEggData.ts`

**Audit:**
- [ ] Eligible batches: layer week≥19; duck + duck_type=layer week≥20; no meat duck; turkey only if product wants (default **exclude**)
- [ ] Sale: inventory + withdrawal gate + revenue always

**TDD:** pure `isEggEligibleBatch(batch, week)` helper.

**Acceptance:** Week 18 layer cannot record collection in UI; sale creates revenue.

---

### Flow H — Mortality / bird sale

**Files:** batch utils, BirdSaleDialog, OverviewTab

**Audit:**
- [ ] Withdrawal blocks sale
- [ ] Population update + revenue

**Acceptance:** Sale blocked when `has_active_withdrawal`.

---

### Flow I — Terminate

**Files:** `TerminationDialog.tsx`

**Audit:**
- [ ] Normal terminate blocked on withdrawal; emergency explicit
- [ ] Revenue if birds sold
- [ ] House release

**Acceptance:** Withdrawal blocks normal terminate.

---

### Flow J — Jobs

**Files:** `supabase/functions/*`, cron SQL

**Audit:**
- [ ] `cron_advance_batch_weeks`, `cron_generate_daily_tasks`, `cron_check_withdrawal_periods` exist post-reset
- [ ] Edge functions present; document how to `functions serve` without admin

**Acceptance:** Manual SQL invoke of cron function succeeds on local DB (or documented Edge invoke).

---

### Flow K — Dashboard / Finance read

**Files:** `useDashboardLogic.ts`, `useFinanceData.ts`

**Audit:**
- [ ] Costs respect privacy toggle
- [ ] Tasks today counts health + batch tasks without double-counting confusion
- [ ] Finance lists auto sources

**Acceptance:** Dashboard loads; finance shows auto:feed rows from Flow C/E.

---

## Phase 3 — RPC harden (after A–K green)

- Atomic RPCs for create_batch, complete_health_task, confirm_day_feed, stock_purchase (as needed).
- Each RPC: `assert_farm_owner`, single transaction, idempotency.

## Phase 4 — Protocol seed polish

- Duck niacin as lean milestones not mega-duration task.
- Turkey blackhead biweekly kept lean.

---

## Definition of done (whole program)

- [ ] `npm run backend` works without admin elevation
- [ ] `npm run frontend` against local Supabase
- [ ] All migrations applied
- [ ] Flows A–K acceptance checked
- [ ] `npm test` green for new tests
- [ ] Docs: CANONICAL_JOURNEYS + BACKEND_LOCAL accurate
- [ ] No requirement for Admin PowerShell in daily path

---

## Status tracker

| Phase / Flow | Status |
|---|---|
| Docs CANONICAL_JOURNEYS | done |
| 0.1 bun scripts + no-admin daily path | done |
| 0.2 Docker + Supabase | **done** — WSL Docker Engine + CLI; supabase up; all migrations applied |
| 0.3 Frontend boot | bun install done; `.env.local` written |
| 1 Foundation | dual ledger + water gate done; continue Flow A |
| A–K | pending after 0.2 green |
| Phase 3–4 | deferred until A–K green |

### Docker binary key (resolved diagnosis)

- Log: `getting backend binary path: cannot find registry key SOFTWARE\Docker Inc.\Docker Desktop`
- Cause: installer interrupted in Phase Components; Program Files present, registry absent
- Fix: one elevated reinstall (`bun run docker:fix` or winget); exit `-5` = UAC cancelled
- Daily after fix: **no admin** (`bun run backend`)

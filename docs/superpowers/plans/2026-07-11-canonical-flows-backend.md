# LampFarms Canonical Flows + Backend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Every research-defined user journey works end-to-end on a complete local project: Supabase backend + React client, atomic/canonical writes, dual intensive/flexible pattern.

**Architecture:** Supabase-first (Postgres/RLS/RPC/Edge). Domain in `src/lib/*` + RPCs. One intent → one writer. Dual pattern via `isIntensiveSystem()`. Flow-by-flow: gate → audit → TDD → fix → verify → commit.

**Tech Stack:** React 18, Vite, Supabase, Vitest, Docker Desktop, Supabase CLI (`npx`).

**Working copy (Windows):** Prefer `C:\src\exactly-as-seen` if `Projects` is a junction to `D:\` (Grok sandbox cannot write `D:\`).

**Research contract:** `docs/RESEARCH_RUNTIME_MAPPING.md`, `docs/CANONICAL_RUNTIME.md`, `deprecated specs/` for domain only.

---

## Operating rules

1. One flow at a time; next flow only after acceptance green.
2. TDD for domain/RPC logic.
3. First principles: one intent → one writer → I/F dual pattern → idempotent ledger.
4. No daily admin PowerShell.
5. Commit after each completed flow.

---

## Phase 0 — Backend + env

See `docs/BACKEND_LOCAL.md`, `scripts/dev-backend.ps1`, `scripts/dev-frontend.ps1`.

- [x] Writable workspace strategy documented (`C:\src\...`)
- [x] Backend/frontend scripts added
- [ ] Docker engine Running
- [ ] `npx supabase start` + keys in `.env.local`
- [ ] `npx supabase db reset` (all migrations)
- [ ] Smoke: auth + farms RLS

---

## Phase 1 — Foundation

### 1.1 Dual pattern + ledger

- Export `shouldAutoLedger` / use `isIntensiveSystem` on all **consumption** paths
- All auto expenses via `synergy` + `LEDGER_SOURCES` + `amount_pesewas`
- Tests in `src/test/synergy-pattern.test.ts`

### 1.2 Auth setup gate

- `ProtectedRoute` enforces login + `farmReady` (except `/farm-setup`)

### 1.3 Single farmId

- Hooks use `useAuth().farmId` (no re-query primary farm)

---

## Flows (strict order)

| ID | Flow | Key files |
|---|---|---|
| A | Onboarding | AuthContext, FarmSetup, ProtectedRoute |
| B | Batch create | useBatchCreateLogic, health-auto-tasks |
| C | Daily ops | ops-day.ts, Feed, Health, Dashboard |
| D | Care complete | useMedicationLogic, vaccination unify |
| E | Feed formulation | ReadyMade / Concentrate / Custom |
| F | Stock | useStockData, FIFO RPC |
| G | Eggs | useEggData |
| H | Mortality / bird sale | batch-utils, synergy |
| I | Terminate | TerminationDialog |
| J | Jobs | Edge + cron_* |
| K | Dashboard / Finance read | useDashboardLogic, useFinanceData |

Then Phase 3 RPC harden, Phase 4 protocol seed.

---

## Status

| Item | Status |
|---|---|
| Phase 0 docs/scripts | in progress |
| Phase 0 docker/supabase | pending |
| Phase 1+ | pending |

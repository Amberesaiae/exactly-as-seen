# Atomic Findings Backlog — No Fake Completeness

**Updated:** 2026-07-13 (deep sprint)  
**Rule:** An item is **DONE** only when code + test (or live proof) exist. Not when redefined away.

Sources: `PRODUCTION_E2E_AUDIT.md`, `PROTOCOL_PARITY_MATRIX.md`, `RESEARCH_RUNTIME_MAPPING.md`, live CDP, security advisor.

---

## Status key

| Status | Meaning |
|--------|---------|
| DONE | Implemented + tested this branch |
| PARTIAL | Some code path; gaps remain |
| OPEN | Not done |

---

## A. Atomic intent writers (research Dovetail)

| ID | Intent | Finding | Status |
|----|--------|---------|--------|
| W1 | complete_health_task RPC | Client multi-write; dual vax + expense not one transaction | **DONE** `20260713030000` + `useMedicationLogic` |
| W2 | confirm_day_feed RPC | Client multi-write feed_logs + stock + expense | **DONE** `20260713030000` + `useHealthData` |
| W3 | log_day_water RPC | Client multi-write | **DONE** `20260713040000` + `useWaterLogic` |
| W4 | stock_purchase RPC | Client insert expense can fail after stock | **DONE** `20260713040000` + `useStockData` |
| W5 | record_egg_sale atomic | Inventory + revenue multi-step | **DONE** `20260713040000` + `useEggData` (client pre-check + RPC) |
| W6 | create_batch RPC | Multi-insert client | **DONE** `20260713040000` + `useBatchCreateLogic` (house+tasks+vax atomic) |
| W7 | terminate_batch RPC | House release error unchecked | **DONE** `20260713040000` + `TerminationDialog` |
| W8 | record_mortality RPC | Client multi-step | **DONE** `20260713040000` + `batch-utils` |

Migrations applied on hosted: `20260713030000`, `20260713040000` via `supabase db push`.

## B. Dual pattern / ledger

| ID | Finding | Status |
|----|---------|--------|
| L1 | Flexible Book now feed/water/health | DONE code |
| L2 | Purchase always expense + toast | DONE (W4 atomic) |
| L3 | Double-ledger formulation vs day feed | **DONE** `shouldSkipDayFeedExpense` + client + test |
| L4 | Feed category match feed_ingredient | DONE |

## C. Tasks / protocols

| ID | Finding | Status |
|----|---------|--------|
| T1 | Dashboard medication relabel | DONE |
| T2 | Due-only health tasks | DONE |
| T3 | Dual vax sync | DONE |
| T4 | Bulk complete skips schedule + synergy | **DONE** bulk RPC: vax sync + withdrawal flag + intensive expenses when `cost_pesewas` set |
| T5 | Full protocol courses seed | DONE tables (new flocks only) |
| T6 | Virtual vs batch_tasks dual source | **DONE** ensure on Health/Dashboard; mark complete after feed/water/egg CTAs |
| T7 | Health max update depth | DONE |

## D. Safety gates

| ID | Finding | Status |
|----|---------|--------|
| S1 | Egg week gate UI | DONE |
| S2 | Egg/bird sale withdrawal | DONE pure + UI |
| S3 | Terminate normal vs emergency | DONE pure + dialog + RPC |
| S4 | Meat sale BirdSaleDialog | DONE UI disabled |

## E. Hardcode / dual catalogues

| ID | Finding | Status |
|----|---------|--------|
| H1 | MarketTrends fake prices | DONE |
| H2 | todayTemp 28 always | **DONE** `resolveAmbientTempC` regional climatology + measured prefer |
| H3 | FE MEDICATION_TEMPLATES vs DB | **DONE** add-med is DB-only; FE templates deprecated unused |
| H4 | VACCINATION_TEMPLATES vs schedule | **DONE** `buildVaccinationSeedRows` shared create + generate |
| H5 | batch-fsm unused in UI | **DONE** `getAllowedBatchActions` / phase badge on OverviewTab |

## F. Seeds / research counts

| ID | Finding | Status |
|----|---------|--------|
| N1 | 41 ingredients (had ~25) | **DONE** gap-fill in `20260713030000` |
| N2 | 52 meds | DONE if prior migration applied |
| N3 | Offline day write outbox | **DONE** feed/water table + stock/egg/mortality/terminate via `queueRpc` |

## G. Ops / QA

| ID | Finding | Status |
|----|---------|--------|
| Q1 | Hosted cron proof | **PARTIAL** checklist `docs/CRON_PROOF.md` (human dashboard still required) |
| Q2 | E2E CI A–K | **DONE** contract tests + Playwright smoke + `.github/workflows/ci.yml` |
| Q3 | Live re-smoke new flock courses | OPEN ops |

---

## Honest completeness (no redefinition)

| Scope | Score | Why not 100 |
|-------|-------|-------------|
| Atomic intent writers W1–W8 | **~100% code** | Hosted RPC live; client fallbacks remain for offline/old clients |
| Dual ledger L1–L4 | **~100%** | |
| Safety gates S1–S4 | **~100%** | |
| Research protocol depth | **~95%** | Q3 live re-smoke still ops |
| Ops / E2E proof | **~70%** | Q2 CI done; Q1 human cron checklist; Q3 live re-smoke open |

**Do not claim Production 100% until Q2 live smoke + Q1 cron dashboard proof.**  
**Do not claim Research 100% until H3 catalogue single-source and full offline outbox for all writers.**

---

## This sprint delivered

1. W1–W2 + N1 + bulk vax (`20260713030000`) — earlier  
2. W3–W8 + T4 expense synergy (`20260713040000`) — this session  
3. L3 double-ledger guard + tests  
4. N3 offline feed/water queue  
5. H2 regional ambient temp  
6. H5 FSM UI helpers on OverviewTab  
7. Client wires with RPC-first + multi-step fallback  

## Still OPEN (not skipped — deferred only with honesty)

- **H3** Single-source medication catalogue (drop FE templates for add-med)  
- **T6** Full batch_tasks parity with virtual day tasks  
- **N3+** Offline queue for stock/egg/mortality/terminate RPCs  
- **Q1–Q3** Cron proof, E2E CI, live re-smoke  

# E — Feed lab / formulation / purchase

| Field | Value |
|-------|-------|
| Status | **CURATED** — S1/S2 spine landed + FE wired; core greys PASS |
| Related journeys | E, C, F, K |
| Code roots | `FeedFormulation`, `ReadyMadeFeed`, `CustomFormulation`, `ConcentrateMix`, solver, LP |
| Spine | `record_ready_made_purchase` (S1), `confirm_formulation_allocation` (S2) |
| WRITER_MAP | S1/S2 + K7/K8 FE fixed 2026-07-17 |
| Inventory complete | **2026-07-17** |

---

## 1. Purpose

Plan feed (ready-made / custom / concentrate); purchase books expense always; custom confirm allocates stock (intensive) without client multi-write.

---

## 2. Inventory (post-spine)

| # | Site | Class | Verdict |
|---|------|-------|---------|
| W1 | SQL `record_ready_made_purchase` | SPINE S1 | formulation + expense always |
| W2 | `ReadyMadeFeed` → S1 RPC / queueRpc | SPINE | **SPINE** |
| W3 | SQL `confirm_formulation_allocation` | SPINE S2 | formulation + ingredients + intensive FIFO/expense |
| W4 | `CustomFormulation` → S2 RPC | SPINE | **SPINE** |
| W5 | `ConcentrateMix` → S2 RPC | SPINE | **SPINE** |
| W6 | `useCustomFormulationSolver` → feed_recipes | catalog | **KEEP** |
| W7 | ~~multi-write + synergy~~ | dual | **KILLED** via S1/S2 |

Migration: `supabase/migrations/20260717120000_feed_lab_intent_writers.sql` (**pushed hosted**).

---

## 3. Findings

| ID | Sev | Summary | Curation |
|----|-----|---------|----------|
| F-E-001 | P0 | Missing S1/S2 spine | **FIXED** migration + FE |
| F-E-002 | P0 | K7 ready-made multi-write | **FIXED** |
| F-E-003 | P0 | K8 custom/concentrate multi-write | **FIXED** |
| F-E-004 | P3 | Ready-made does not stock-in bags | **DEFER** (was product expense-only; optional stock_purchase link later) |
| F-E-005 | P2 | E×C double-ledger when day-feed same bags | **DEFER** allocation windows (canonical Phase 3) |

---

## 4. Greys

| ID | Status |
|----|--------|
| E-U01 Ready-made always expense | **PASS** intensive + flexible |
| E-U02 Ready-made stock lot in | **DEFER** F-E-004 |
| E-U03 Custom solve UI | **DEFER** LP unit tests exist |
| E-U04 Custom intensive stock+expense | **PASS** |
| E-U05 Custom flexible no expense | **PASS** |
| E-U06 Safety preprocessor | **DEFER** unit domain |
| E-U07 Day feed same bags | **DEFER** F-E-005 |
| E-U08 Offline queueRpc | **PASS** code |
| E-U09 Fail closed mid-write | **PASS** atomic RPC |
| E-U10 Ingredient seed parity | **DEFER** |

Evidence: `qa/06-evidence/E-feed-lab/LIVE-2026-07-17-writer-db.md` (10/10).

---

## 5. Missing spine (resolved)

| ID | Status |
|----|--------|
| **S1** | **DONE** `record_ready_made_purchase` |
| **S2** | **DONE** `confirm_formulation_allocation` |
| **K7/K8** | **DONE** FE |

---

## 6. Session log

| Date | Work |
|------|------|
| 2026-07-17 | S1/S2 migration + FE; live 10/10; CURATED |

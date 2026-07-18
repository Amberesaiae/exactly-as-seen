# D — Care & health (complete, vax, conflicts)

| Field | Value |
|-------|-------|
| Status | **CURATED** — K5/K6 FE fixed; core writer+DB greys PASS; residual DEFER |
| Related journeys | D, B seed, G/H withdrawal, K |
| Code roots | `Health.tsx`, `useMedicationLogic`, `useVaccinationLogic`, `care-completion`, `complete_health_task`, bulk RPC |
| Spine | `complete_health_task` / `bulk_complete_health_tasks` |
| WRITER_MAP | K5/K6 FE fixed 2026-07-17; residual seed dual helpers exist but unused as primary |
| Inventory complete | **2026-07-17** |
| Auditor | deep QA resume session |

---

## 1. Purpose

Protocol tasks, medications, vaccinations, conflicts C1–C8, withdrawal, intensive ledger, post-vax supplements.

---

## 2. Inventory (complete)

### 2.1 Spine RPCs

| Function | Effects |
|----------|---------|
| `complete_health_task` | assert owner; mark health_tasks done; sync vaccination_schedule if vax; withdrawal flags on batch; intensive expense if cost>0; activity_log; idempotent `already_completed` |
| `bulk_complete_health_tasks` | week window complete health_tasks + schedule sync by product_name; **no** per-task expense |

### 2.2 Client writers

| # | file:function | Class | Verdict |
|---|---------------|-------|---------|
| W1 | `useMedicationLogic.markTaskComplete` → `rpc('complete_health_task')` | SPINE | **SPINE** |
| W2 | same offline → `queueRpc('complete_health_task')` | OFFLINE-OK | **KEEP** |
| W3 | `runPostCompletionSideEffects` stock/expense after RPC | dual | **K6 KILLED** — supplements only |
| W4 | Book now toast → `autoDeductStock` + `autoCreateExpense` `:book` | KEEP | **KEEP** flexible |
| W5 | `useVaccinationLogic.markVaccineAdministered` was schedule.update + sync + expense | dual | **K5 KILLED** → now `complete_health_task` only |
| W6 | `useVaccinationLogic` offline was schedule queueWrite | dual | **fixed** → queueRpc complete |
| W7 | `seedPostVaccinationSupplements` | FE seed | **KEEP** (best-effort after RPC) |
| W8 | `bulk_complete_health_tasks` + post seed | SPINE bulk | **SPINE** + seed only |
| W9 | `addMedication` → health_tasks.insert | create | **KEEP** (not complete intent); C1–C8 client gate |
| W10 | `generateVaccinationSchedule` → schedule insert | seed | **KEEP** (not complete); grey: may lack twin health_tasks |
| W11 | `syncHealthTaskFromSchedule` / `syncScheduleFromHealthTask` | dual helpers | **dead as primary** after K5; bulk still calls schedule sync helper (redundant with bulk RPC) |

### 2.3 Dual tables (target after CLOSED)

| Table | Allowed writers |
|-------|-----------------|
| health_tasks | create_batch seed, add med, complete RPC, post-vax seed |
| vaccination_schedule | create_batch seed; complete **only via RPC** |
| batch_tasks | daily ops only |

---

## 3. Findings

| ID | Sev | Class | Summary | Curation |
|----|-----|-------|---------|----------|
| F-D-001 | P0 | dual-writer | **K5** Vaccines tab multi-write schedule + health + expense | **FIXED** FE |
| F-D-002 | P0 | dual-writer / ledger | **K6** post-RPC auto stock+expense double ledger risk | **FIXED** FE |
| F-D-003 | P2 | gap | Vaccine complete fails closed if no matching health_task | ACCEPT residual (correct fail-closed) |
| F-D-004 | P2 | gap | bulk RPC does not ledger costs | DEFER (no cost UI on bulk) |
| F-D-005 | P3 | seed | generateVaccinationSchedule without health_tasks twins | DEFER |

---

## 4. Grey usecases

| ID | Usecase | Status |
|----|---------|--------|
| D-U01 | Complete med intensive + cost | **PASS** writer+DB (exp+withdrawal) |
| D-U02 | Complete flexible + Book now | **PASS** no auto exp; book exp |
| D-U03 | Complete vax This Week | **PASS** task+schedule+auto:vaccination |
| D-U04 | Vaccines tab = same spine | **PASS** FE K5 + RPC twin sync |
| D-U05 | Bulk complete week | **DEFER** live UI |
| D-U06 | Add med C1/C2 BLOCK | **DEFER** unit exists; live UI |
| D-U07 | Add med C6/C7 WARN | **DEFER** |
| D-U08 | Withdrawal after med | **PASS** (with D-U01) |
| D-U09 | Post-vax supplements | **DEFER** seed best-effort |
| D-U10 | Double complete | **PASS** already_completed |
| D-U11 | RPC fail fail-closed | **PASS** |
| D-U12 | No double expense | **PASS** live + K6 static |
| D-U13 | Multi-flock care bleed | **DEFER** |
| D-U14 | Offline complete queueRpc | **PASS** contract code |
| D-U15 | Orphan schedule | **PASS** FE fail-closed |
| D-U16 | already_completed | **PASS** (= D-U10) |

Evidence: `qa/06-evidence/D-care/LIVE-2026-07-17-writer-db.md` (14/14).

---

## 5. Kill list

| ID | Status |
|----|--------|
| **K5** | **FIXED** FE 2026-07-17 |
| **K6** | **FIXED** FE 2026-07-17 |

---

## 6. Session log

| Date | Work |
|------|------|
| 2026-07-17 | Inventory; K5/K6 FE kill; contract locks; acid pending |
| 2026-07-17 | Live writer+DB 14/14; tests 22; → **CURATED** (not CLOSED — D-U05/06/07/09/13 deferred) |

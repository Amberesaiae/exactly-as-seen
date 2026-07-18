# G — Eggs

| Field | Value |
|-------|-------|
| Status | **CURATED** — K4 sale fallthrough killed; core greys PASS |
| Related journeys | G, D withdrawal, K |
| Code roots | `Eggs.tsx`, `useEggData`, egg RPCs |
| Spine | `record_egg_collection` + `record_egg_sale` |
| WRITER_MAP | K4 FE fixed 2026-07-17 |
| Inventory complete | **2026-07-17** |

---

## 1. Purpose

Collect (week gates), grade inventory, sell with revenue, withdrawal block.

---

## 2. Inventory

| # | Site | Class | Verdict |
|---|------|-------|---------|
| W1 | `recordCollection` → `rpc('record_egg_collection')` | SPINE | **SPINE** |
| W2 | offline collection → `queueRpc` | OFFLINE-OK | **KEEP** |
| W3 | FE week gates layer/duck | gate | **KEEP** (client; RPC lacks week gate) |
| W4 | `recordSale` → `rpc('record_egg_sale')` | SPINE | **SPINE** |
| W5 | offline sale → `queueRpc` | OFFLINE-OK | **KEEP** |
| W6 | ~~sale fallthrough~~ egg_sales + autoCreateRevenue | dual | **K4 KILLED** |
| W7 | FE withdrawal + inventory prechecks | gate | **KEEP** (RPC re-checks) |

---

## 3. Findings

| ID | Sev | Summary | Curation |
|----|-----|---------|----------|
| F-G-001 | P0 | **K4** sale fallthrough multi-write | **FIXED** fail-closed |
| F-G-002 | P3 | Week gate client-only (RPC no week check) | **DEFER** fold into collection RPC |

---

## 4. Greys

| ID | Status |
|----|--------|
| G-U01 Layer week 1 blocked | **PASS** FE gate code |
| G-U02 Layer week 19+ collect | **PASS** live |
| G-U03 Duck meat no eggs UI | **DEFER** UI nav |
| G-U04 Duck layer week 20 | **DEFER** |
| G-U05 Sale within inventory | **PASS** revenue auto:eggs |
| G-U06 Sale over inventory | **PASS** |
| G-U07 Sale under withdrawal | **PASS** |
| G-U08 Fallthrough disabled | **PASS** |
| G-U09 Graded/total inventory | **PASS** get_egg_inventory |
| G-U10 Offline queueRpc | **PASS** code |
| G-U11 Payment normalize | **PASS** code |

Evidence: `qa/06-evidence/G-eggs/LIVE-2026-07-17-writer-db.md` (14/14).

---

## 5. Kill list

| ID | Status |
|----|--------|
| **K4** | **FIXED** FE 2026-07-17 |

---

## 6. Session log

| Date | Work |
|------|------|
| 2026-07-17 | Inventory; K4 kill; live 14/14; CURATED |

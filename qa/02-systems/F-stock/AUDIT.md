# F — Stock / inventory

| Field | Value |
|-------|-------|
| Status | **CURATED** — K3 purchase + K9 usage sole RPC |
| Related journeys | F, C, D, E, K |
| Code roots | `Stock.tsx`, `useStockData`, `stock_purchase`, `stock_usage`, FIFO RPC, `stock-match` |
| Spine | `stock_purchase` (purchase); `stock_usage` (usage) |
| WRITER_MAP | K3 + K9 FIXED 2026-07-17 |
| Inventory complete | **2026-07-17** |
| Auditor | deep QA resume |

---

## 1. Purpose

Items, lots A/B/C/damaged, purchase always expense, usage FIFO, alerts.

---

## 2. Inventory

| # | file:function | Class | Verdict |
|---|---------------|-------|---------|
| W1 | `useStockData.recordTransaction` purchase → `rpc('stock_purchase')` | SPINE | **SPINE** |
| W2 | offline purchase → `queueRpc('stock_purchase')` | OFFLINE-OK | **KEEP** |
| W3 | ~~purchase fallthrough~~ tx+lot+qty+expense | dual | **K3 KILLED** |
| W4 | `addStockItem` → stock_items insert | catalog | **KEEP** |
| W5 | usage → `rpc('stock_usage')` / offline `queueRpc` | SPINE | **SPINE** (K9 FIXED) |
| W6 | adjustment → tx + qty | multi | low priority |
| W7 | SQL `stock_purchase` | SPINE | tx + lot + qty + expense `auto:stock` |
| W8 | SQL `stock_usage` | SPINE | tx + FIFO + qty + activity |
| W9 | SQL `allocate_fifo_by_quality` | helper | used by usage + day feed RPC |

---

## 3. Findings

| ID | Sev | Summary | Curation |
|----|-----|---------|----------|
| F-F-001 | P0 | **K3** purchase multi-write fallthrough after RPC miss | **FIXED** fail-closed |
| F-F-002 | P2 | **K9** usage non-atomic | **FIXED** `stock_usage` RPC + FE sole path |

---

## 4. Greys

| ID | Status |
|----|--------|
| F-U01 New item | **PASS** |
| F-U02 Purchase priced | **PASS** (qty+lot+exp 12500) |
| F-U03 Purchase always expense | **PASS** |
| F-U04 RPC fail no orphan | **PASS** |
| F-U05 Usage FIFO | **PASS** (via stock_usage → allocate_fifo_by_quality) |
| F-U06 Damaged excluded | **DEFER** |
| F-U07 Quality grade A | **PASS** |
| F-U08 feed category match | **PASS** |
| F-U09 multi-item pick | covered by stock-match unit + F-U08 |
| F-U10 Offline queueRpc | **PASS** code (purchase + usage) |
| F-U11 Fallthrough gone | **PASS** grep |
| F-U12 Usage mid-fail | **PASS** (=K9 atomic; insufficient fails closed) |
| F-U13 free purchase no expense | **PASS** |

Evidence: `qa/06-evidence/F-stock/LIVE-2026-07-17-writer-db.md` (12/12); `LIVE-2026-07-17-k9-stock-usage.md` (7/7).

---

## 5. Kill list

| ID | Status |
|----|--------|
| **K3** | **FIXED** FE 2026-07-17 |
| **K9** | **FIXED** migration + FE 2026-07-17 |

---

## 6. Session log

| Date | Work |
|------|------|
| 2026-07-17 | Inventory; K3 kill; live 12/12; CURATED |
| 2026-07-17 | K9 `stock_usage` + FE sole; live 7/7; residual closed |

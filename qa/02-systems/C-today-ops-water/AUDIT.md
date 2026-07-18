# C — Today ops: day water

| Field | Value |
|-------|-------|
| Status | **CURATED** — sole `log_day_water` re-proved; Book now KEEP |
| Related journeys | C, D, K |
| Code roots | `Health` Water tab, `useWaterLogic`, `log_day_water` |
| Spine | `log_day_water` |
| WRITER_MAP | SPINE + Book now synergy |
| Inventory complete | **2026-07-17** |

---

## Inventory

| Site | Verdict |
|------|---------|
| `useWaterLogic.logWater` → `rpc('log_day_water')` | **SPINE** |
| Offline `queueRpc('log_day_water')` | **KEEP** |
| Book now `autoCreateExpense` `:book` | **KEEP** |
| Fail-closed toast on rpcErr | **FIXED** (was throw) |

## Greys

| ID | Status |
|----|--------|
| C-W-U01 intensive + rate | **PASS** exp=189 (10gal×3.785×5) |
| C-W-U02 rate 0 | **PASS** no expense |
| C-W-U03 flexible + book | **PASS** |
| C-W-U07 offline | **PASS** code |
| C-W-U09 fail-closed | **PASS** |
| C-W-U04 duplicate day | **DEFER** (no unique on water_records day) |
| C-W-U05/U08 temp / duck band | **DEFER** UI research |

Evidence: `qa/06-evidence/C-water/LIVE-2026-07-17-writer-db.md`

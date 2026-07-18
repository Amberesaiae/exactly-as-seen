# I — Terminate flock

| Field | Value |
|-------|-------|
| Status | **CURATED** — sole `terminate_batch` re-proved |
| Related journeys | I, H, B house free |
| Code roots | `TerminationDialog`, `terminate_batch` |
| Spine | `terminate_batch` |
| Inventory complete | **2026-07-17** |

---

## Inventory

| Site | Verdict |
|------|---------|
| `TerminationDialog` → RPC | **SPINE** |
| Offline queueRpc | **KEEP** |
| Dead dual imports (synergy cleanup) | **REMOVED** |
| Fail-closed toast (no throw) | **FIXED** |

## Greys

| ID | Status |
|----|--------|
| I-U01/02 terminate + revenue | **PASS** house free, rev 50000 |
| I-U03 normal under withdrawal | **PASS** blocked |
| I-U04 emergency | **PASS** |
| I-U05 house reusable | **PASS** |
| I-U06 offline | **PASS** code |

Evidence: `qa/06-evidence/I-terminate/LIVE-2026-07-17-writer-db.md`

# S-settings occupied house delete — live acid — 2026-07-17

**User:** live.fix.1783906173@example.com  
**Migration:** `20260717150000_stock_usage_and_house_delete_guard.sql`  
**Trigger:** `houses_guard_delete` → `guard_house_delete()`

| ID | Verdict | Detail |
|----|---------|--------|
| S-U02 occupied delete | **PASS** | DELETE refused: `cannot delete house while occupied by a flock` |
| S-U02 free delete | **PASS** | unoccupied house delete ok |
| FE pre-check | **PASS** | FarmTab blocks when `occupied_by_batch_id` or active flock |

Combined probe log also in `qa/06-evidence/F-stock/LIVE-2026-07-17-k9-stock-usage.md`.

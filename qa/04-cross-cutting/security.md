# Cross-cutting: security

**Status:** **CURATED** (2026-07-17)

## Checks

| Check | Status |
|-------|--------|
| `assert_farm_owner` on intent RPCs | **PASS** cross-farm confirm_day_feed denied |
| Farmer cannot call cron SQL RPCs | **PASS** permission denied |
| Expense category CHECK | **PASS** (K pack) |
| RLS on domain tables | present; residual client INSERT on feed_logs DEFER F-C-F-005 |
| Bird sale meat withdrawal server gate | **PASS** after H fix |
| Egg sale withdrawal server gate | **PASS** (G pack) |

## Residual

- Defense-in-depth: revoke client INSERT on feed_logs / egg_sales / etc.  

**Closed this session:** Occupied house delete hard-blocked (trigger `houses_guard_delete` + FarmTab FE).

Evidence: cross-cutting live + system packs + S house-delete live

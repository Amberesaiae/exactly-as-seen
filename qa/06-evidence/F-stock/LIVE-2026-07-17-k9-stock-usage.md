# F-stock K9 + S house-delete — live acid — 2026-07-17

**User:** live.fix.1783906173@example.com  
**Migration:** `20260717150000_stock_usage_and_house_delete_guard.sql` pushed hosted  
**Probe:** supabase db push --linked + node live RPC/DB checks

| ID | Verdict | Detail |
|----|---------|--------|
| AUTH | **PASS** | live.fix.1783906173@example.com |
| K9 usage RPC | **PASS** | `stock_usage` qty 50→38; tx type=`usage`; rpcNew=38 |
| K9 insufficient | **PASS** | fail-closed: `insufficient stock: on hand 38, requested 9999` |
| FE stock_usage | **PASS** | `useStockData` `rpc('stock_usage'` + `queueRpc('stock_usage'` |
| S occupied delete | **PASS** | DB: `cannot delete house while occupied by a flock` |
| S free delete | **PASS** | free house delete ok |
| FE house guard | **PASS** | `FarmTab` toast `Cannot delete house…` + occupied check |

**Summary:** 7/7

K9 FIXED: sole `stock_usage` RPC (tx + FIFO + qty). House delete FIXED: trigger `houses_guard_delete` + FE pre-check.

### Resume re-prove 2026-07-17 (session continue)

| Check | Result |
|-------|--------|
| K9 usage | PASS `50→38` tx=`usage` rpcNew=38 |
| K9 insufficient | PASS fail-closed |
| house occupied delete | PASS `cannot delete house while occupied by a flock` |
| house free delete | PASS |
| FE locks | PASS |
| contract tests | PASS `journeys-a-k.contract.test.ts` 19/19 (usage slice excludes residual adjustment) |

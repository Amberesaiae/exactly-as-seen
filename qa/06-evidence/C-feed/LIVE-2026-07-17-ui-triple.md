# C-feed UI + network + DB — 2026-07-17

**Base:** http://127.0.0.1:5173
**User:** live.fix.1783906173@example.com
**Batch:** 0ce8d74a-7771-448c-acd5-b5b913aef6f5
**Storage key:** sb-ulliwnizurgfbwryhnng-auth-token

| ID | Verdict | Detail |
|----|---------|--------|
| UI-AUTH | **PASS** | url=http://127.0.0.1:5173/feed |
| UI-C1 CTA | **PASS** | Confirm visible |
| UI-C2 toast | **PASS** | Today's feeding confirmed: 5.0kg (stock out; expense skipped — purchased today) |
| UI-C2b network RPC | **PASS** | confirm_day_feed |
| UI-C2c no feed_logs POST | **PASS** | clean |
| UI-C2d no expenses POST | **PASS** | clean |
| UI-DB feed_logs | **PASS** | rows=1 qty=5 |
| UI-DB expense+stock | **PASS** | exp=0 stock 400→400 |
| UI-DB intensive stock-out | **PASS** | stockMoved=false exp=0 |

**Summary:** 9/9

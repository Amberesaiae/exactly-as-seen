# F-stock live acid — writer + DB — 2026-07-17

**User:** live.fix.1783906173@example.com
**Farm:** a215f55a-b7bb-4c82-8aeb-dc63b9429cdf
**Item:** fee3472d-74df-4b6e-bda9-da1c68b56d92

| ID | Verdict | Detail |
|----|---------|--------|
| AUTH | **PASS** | live.fix.1783906173@example.com |
| FARM | **PASS** | a215f55a |
| F-U01 | **PASS** | item=fee3472d |
| F-U02 | **PASS** | qty=25 lots=1 exp=12500 |
| F-U07 | **PASS** | grade=A |
| F-U03 | **PASS** | exp=1 25→30 |
| F-U04 | **PASS** | stock item not found |
| F-U05 | **PASS** | 30→27 |
| F-U10 | **PASS** | queueRpc offline |
| F-U11 | **PASS** | no expenses fallthrough; fail closed |
| F-U13-free | **PASS** | exp=0 |
| F-U08 | **PASS** | pick=Broiler Starter Feed |

**Summary:** 12/12

K3: purchase fallthrough killed FE. K9 usage closed in LIVE-2026-07-17-k9-stock-usage.md.

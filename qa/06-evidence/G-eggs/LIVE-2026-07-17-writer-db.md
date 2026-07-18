# G-eggs live acid — writer + DB — 2026-07-17

**User:** live.fix.1783906173@example.com
**Farm:** a215f55a-b7bb-4c82-8aeb-dc63b9429cdf
**Layer batch:** 1ce4bae4-59ec-4b0d-9a30-70d708b71e81

| ID | Verdict | Detail |
|----|---------|--------|
| AUTH | **PASS** | live.fix.1783906173@example.com |
| FARM | **PASS** | a215f55a |
| BATCH | **PASS** | 1ce4bae4 week=20 |
| G-U01 | **PASS** | FE week gate for early layer collect |
| G-U02 | **PASS** | rows=1 good=85 id=96111182 |
| G-U02-dup | **PASS** | rpc={"ok":false,"reason":"duplicate"} |
| G-U09 | **PASS** | onHand=85 err=undefined |
| G-U05 | **PASS** | sale=0e312552 rev=4500 src=auto:eggs |
| G-U06 | **PASS** | insufficient eggs: on hand 55, requested 555 |
| G-U07 | **PASS** | cannot record egg sale during active medication withdrawal |
| G-U08 | **PASS** | no fallthrough insert/revenue |
| G-U10 | **PASS** | offline queueRpc both |
| G-U11 | **PASS** | payment normalize present |
| G-U12-auth | **PASS** | Access denied for farm 00000000-0000-0000-0000-000000000001 |

**Summary:** 14/14

K4: egg sale fallthrough killed FE.

# D-care live acid — writer + DB — 2026-07-17

**User:** live.fix.1783906173@example.com
**Farm:** a215f55a-b7bb-4c82-8aeb-dc63b9429cdf
**Batch intensive:** 0ce8d74a-7771-448c-acd5-b5b913aef6f5
**Batch flexible:** fbc74b53-0bf8-4707-8d1b-50d5f73f8aa7

| ID | Verdict | Detail |
|----|---------|--------|
| AUTH | **PASS** | live.fix.1783906173@example.com |
| FARM | **PASS** | a215f55a |
| BATCH | **PASS** | 0ce8d74a intensive |
| FLEX | **PASS** | fbc74b53 |
| D-U01 | **PASS** | completed=true exp=1 pesewas=1500 withdrawal=true |
| D-U10 | **PASS** | already_completed=true |
| D-U12 | **PASS** | exp before=1 after=1 (no double) |
| D-U03 | **PASS** | task=true schedule=true exp=1 src=auto:vaccination |
| D-U04 | **PASS** | Vaccines tab must call same RPC (FE K5); RPC twin sync proved |
| D-U02 | **PASS** | autoExp=0 book=1 completed=true |
| D-U11 | **PASS** | rpcErr=Access denied for farm 00000000-0000-0000-0000-000000000001; completed stable=true |
| D-U15 | **PASS** | FE fail-closed when no matching health_task |
| D-U12-static-K6 | **PASS** | runPostCompletionSideEffects money-free |
| D-U04-static-K5 | **PASS** | no schedule primary update |

**Summary:** 14 pass / 0 fail of 14

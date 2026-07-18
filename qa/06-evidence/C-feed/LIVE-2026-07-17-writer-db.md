# C-feed live acid — writer + DB — 2026-07-17

**Auditor:** deep QA continue
**Environment:** https://ulliwnizurgfbwryhnng.supabase.co
**User:** live.fix.1783906173@example.com
**Farm:** a215f55a-b7bb-4c82-8aeb-dc63b9429cdf (Live Audit Farm 1783906174990)
**Date:** 2026-07-17
**Stock:** 2e5aae3a-d481-4d0d-b6d9-09980639ac8f
**Batches:** int=0ce8d74a-7771-448c-acd5-b5b913aef6f5 flex=fbc74b53-0bf8-4707-8d1b-50d5f73f8aa7 dl=1c6cd377-fcd0-4678-acd4-d384719c7865 fr=71b2898f-dc4b-4a1f-8084-e349eff6a8ac cage=f53a815f-7795-4e78-98da-24986f626a34

Harness notes:
- Auth: pre-confirmed thorough user from prior session
- `create_batch` RPC missing from hosted schema cache → batches via direct insert (harness only)
- Soft-closed prior active batches for clean houses

| ID | Verdict | Detail |
|----|---------|--------|
| AUTH | **PASS** | live.fix.1783906173@example.com |
| FARM | **PASS** | a215f55a Live Audit Farm 1783906174990 |
| STOCK | **PASS** | 2e5aae3a qty=400 price=500 |
| BATCHES | **PASS** | intensive:0ce8d74a semi_intensive:fbc74b53 deep_litter:1c6cd377 free_range:71b2898f cage:f53a815f |
| C-F-U01 | **PASS** | logs=1 exp=1 stock 400→390 pesewas=5000 |
| C-F-U06 | **PASS** | already_logged=true logs=1 exp=1 stockStable=true |
| C-F-U02 | **PASS** | logs=1 exp=0 stockStable=true |
| C-F-U03 | **PASS** | logs=1 exp=0 stock 390→383 |
| C-F-U04 | **PASS** | logs=1 exp=0 stockStable=true |
| C-F-U05 | **PASS** | book rows=1 pesewas=4000 |
| C-F-U15 | **PASS** | logs=1 exp=0 stock 383→380 |
| C-F-U21 | **PASS** | logs=1 exp=1 stockΔ=-4 |
| C-F-U22 | **PASS** | logs=1 exp=0 stockStable=true |
| C-F-U18 | **PASS** | active batch not found |
| C-F-U23 | **PASS** | quantity_kg must be positive |
| C-F-U07 | **PASS** | rpcErr=Access denied for farm 00000000-0000-0000-0000-000000000001; logs 10→10; feClean=true |
| C-F-U25 | **PASS** | book rows=1 |
| C-F-U08 | **PASS** | int=0ce8d74a@7 flex=fbc74b53@8 |
| C-F-U10 | **PASS** | queueRpc both paths; flush not live-exercised |
| C-F-SIDE-activity | **PASS** | activity_log feed_log rows=2 |
| C-F-U14 | **PASS** | Book now expense-only: true |
| C-F-U11 | **PASS** | broiler w1 kg/bird=0.05 forageMod=0 |

**Summary:** 22 pass / 0 fail of 22

## Layers
| Layer | Status |
|-------|--------|
| Writer RPC | yes `confirm_day_feed` |
| DB | feed_logs, expenses, stock_items, activity_log |
| UI | still pending |
| Offline flush | U10 contract |

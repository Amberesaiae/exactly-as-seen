# Curation log

Append-only. One row per decision during deep QA.

| Date | Pack | Finding | Decision | Change | Residual | Owner |
|------|------|---------|----------|--------|----------|-------|
| 2026-07-17 | C-today-ops-feed | F-C-F-001 (K1) | FIX | `useFeedData`: rpcErr → toast+return; removed feed_logs+stock+expense fallback | Live acid C-F-U07 still required | QA pack C |
| 2026-07-17 | C-today-ops-feed | F-C-F-002 (K2) | FIX | `useFeedData` offline → `queueRpc('confirm_day_feed')`; grep clean no queueWrite feed_logs | Live offline flush C-F-U10 | QA pack C |
| 2026-07-17 | C-today-ops-feed | F-C-F-003 | FIX | Health Book now → `autoCreateExpense` only (no re-RPC) | Live C-F-U05 / U14 | QA pack C |
| 2026-07-17 | C-today-ops-feed | F-C-F-004 | FIX | Health rpcErr toast+return (was throw) | Path unify F-C-F-006 | QA pack C |
| 2026-07-17 | C-today-ops-feed | F-C-F-005 | DEFER | none | RLS still allows client feed_logs INSERT | spine hardening |
| 2026-07-17 | C-today-ops-feed | F-C-F-006 | DEFER | none | Dual FE confirm implementations | after acid matrix |
| 2026-07-17 | C-today-ops-feed | (matrix) | FIX/DEFER | live evidence writer-db + ui-triple | Residual greys deferred; pack CURATED not CLOSED | QA pack C |
| 2026-07-17 | D-care-health | F-D-001 (K5) | FIX | Vaccines tab → complete_health_task only | Orphan schedule without health_task fails closed | QA pack D |
| 2026-07-17 | D-care-health | F-D-002 (K6) | FIX | strip auto stock/expense from runPostCompletionSideEffects | Bulk still no cost ledger (RPC gap DEFER) | QA pack D |
| 2026-07-17 | F-stock | F-F-001 (K3) | FIX | purchase fail-closed; remove fallthrough multi-write | K9 usage multi-step remains | QA pack F |
| 2026-07-17 | F-stock | F-F-002 (K9) | FIX | stock_usage RPC + FE sole + queueRpc; migration 17150000 | adjustment multi low | QA pack F |
| 2026-07-17 | S-settings | S-U02 house delete | FIX | houses_guard_delete trigger + FarmTab FE block | species/delete-farm DEFER | QA pack S |
| 2026-07-17 | G-eggs | F-G-001 (K4) | FIX | sale fail-closed; remove egg_sales+revenue fallthrough | Week gate still FE-only (F-G-002) | QA pack G |
| 2026-07-17 | E-feed-lab | F-E-001/002/003 (S1/S2/K7/K8) | FIX | migration + FE RPCs; pushed hosted | stock-in DEFER; E×C windows DEFER | QA pack E |
| 2026-07-17 | B-batches | F-B-001 | FIX | types create_batch Args aligned | protocol parity DEFER | QA pack B |
| 2026-07-17 | B-batches | (matrix) | ACCEPT | live multi-species 14/14 sole path | research protocol depth DEFER | QA pack B |
| 2026-07-17 | C-water | (fail-closed UX) | FIX | water rpcErr toast+return | duplicate day DEFER | QA pack C-water |
| 2026-07-17 | H-mortality | F-H-001 meat WD | FIX | record_bird_sale meat_withdrawal + FE canSellBirds | — | QA pack H |
| 2026-07-17 | I-terminate | (cleanup) | FIX | remove dead dual imports; toast fail-closed | — | QA pack I |
| 2026-07-17 | K-hub | F-K-001 records total_eggs | FIX | get_batch_record_summary qualified columns | — | QA pack K |
| 2026-07-17 | J-jobs | (matrix) | ACCEPT | cron.job 4 active + batch_tasks today | week advance fixture DEFER | QA pack J |
| 2026-07-17 | A-onboarding | (matrix) | ACCEPT | login + setup_complete + houses | email-confirm UX DEFER | QA pack A |
| 2026-07-17 | S-settings | (matrix) | ACCEPT | prefs/farm/houses/market live | occupied house delete DEFER | QA pack S |
| 2026-07-17 | cross-cutting ×6 | ACCEPT | dual/offline/security/species/money/flock from pack evidence | live offline flush DEFER | QA cross |
| 2026-07-17 | journeys A–K | ACCEPT | deps CURATED; orchestration views updated | monolithic day-path optional | QA journeys |

---

## Decision definitions

- **FIX** — code/migration changed during or immediately after audit  
- **DEFER** — tracked work remaining (link issue/WRITER_MAP K#)  
- **ACCEPT** — residual known; product owner accepts risk until date  

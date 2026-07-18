# Cross-cutting: multi-flock

**Status:** **CURATED** (2026-07-17)

## Checks

| Check | Status |
|-------|--------|
| ≥1 active multi-batch farm | **PASS** (6 actives on audit farm) |
| Preferred batch after create | **PASS** B-U10 / preferred-batch |
| Feed/care ops scoped by batch_id | **PASS** C/D RPC isolation |
| House occupation exclusive | **PASS** B-U06 / create_batch |

## Residual

- UI combobox automation flakiness with many flocks (ops residual)  
- Hard refresh after create for SPA mount (product note from thorough session)  

Evidence: B pack + C-feed multi-flock greys + live active count

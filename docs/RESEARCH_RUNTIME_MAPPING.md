# Research → Runtime Mapping

**Research:** `deprecated specs/` (Dovetail, dual pattern, events)  
**Runtime:** React 18 + Vite + Supabase  
**Companions:** `docs/CANONICAL_RUNTIME.md`, `src/lib/canonical.ts`

## Dual pattern

| System | Behavior |
|---|---|
| Intensive (`intensive`, `deep_litter`, `cage`) | Auto expense + auto stock on feed/health consumption |
| Flexible (semi/free_range/pasture) | No auto stock/expense on consumption; farmer manual |

Helper: `isIntensiveSystem()` / `shouldAutoLedger()` in `src/lib/production-system.ts`.

## Ledger sources (`LEDGER_SOURCES`)

`auto:feed` · `auto:health` · `auto:water` · `auto:vaccination` · `auto:eggs` · `auto:sale` · `auto:batch` · `auto:stock`

## Events → primary files

| Event | Today | Target RPC |
|---|---|---|
| BATCH_CREATED | `useBatchCreateLogic` + `generateAutoTasks` | `create_batch` |
| FEED_FORMULATION_CONFIRMED | Feed method components + synergy | `confirm_feed_formulation` |
| HEALTH_TASK_COMPLETED | `useMedicationLogic.markTaskComplete` | `complete_health_task` |
| VACCINATION_COMPLETED | `useVaccinationLogic` (parallel table) | fold into health_tasks |
| WEEK_ADVANCED | Edge → `cron_advance_batch_weeks` | keep |
| MORTALITY_RECORDED | `recordMortality` | `record_mortality` |
| BATCH_TERMINATED | `TerminationDialog` | `terminate_batch` |
| EGG collection/sale | `useEggData` | `record_egg_sale` (sale) |
| STOCK_PURCHASE | `useStockData` | `stock_purchase` |
| WITHDRAWAL_ENDED | Edge → cron | keep |
| DAY_FEED / DAY_WATER | `fulfillOperationalTask` / water logic | `confirm_day_feed` / `log_day_water` |

## Implementation order

Phase 0 backend → Phase 1 foundation → Flows A→K → RPC harden → protocol seed.

Full narrative: plan in `docs/superpowers/plans/2026-07-11-canonical-flows-backend.md`.

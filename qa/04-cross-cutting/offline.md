# Cross-cutting: offline

**Status:** **CURATED** (code inventory 2026-07-17)

## Law

Domain intents offline = **`queueRpc` same args as online**.  
Raw `queueWrite` of domain tables for those intents = integrity fail.

## Inventory (post K1–K8 / S1–S2)

| Intent | Online | Offline |
|--------|--------|---------|
| create_batch | RPC | queueRpc |
| confirm_day_feed | RPC | queueRpc |
| log_day_water | RPC | queueRpc |
| complete_health_task | RPC | queueRpc |
| stock_purchase | RPC | queueRpc |
| egg collection/sale | RPC | queueRpc |
| terminate_batch | RPC | queueRpc |
| record_mortality | RPC | queueRpc |
| ready-made / formulation | RPC | queueRpc |
| Settings/prefs/houses | tables | queueWrite **OK** |

## Acid

| Check | Status |
|-------|--------|
| No `queueWrite('feed_logs'` in domain writers | **PASS** grep |
| Flush supports intent RPCs | **PASS** sync.ts list |
| Live Dexie flush e2e | **DEFER** (code path only for most packs) |

Evidence: `qa/06-evidence/cross-cutting/LIVE-2026-07-17.md` X-offline-domain

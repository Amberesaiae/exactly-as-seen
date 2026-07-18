# Spine — single-writer integrity

## Laws (non-negotiable for CLOSED money/care intents)

1. **One intent → one writer → one side-effect set**  
2. **Fail closed** — no client multi-write rescue after RPC fail  
3. **Purchase/sale always ledger**; consumption dual-pattern only  
4. **Offline = queueRpc(same args)** for domain intents  
5. **Policy authority for money** ultimately in RPC; TS is preview  

## Source inventory

Living kill/keep list: **[`docs/WRITER_MAP.md`](../../docs/WRITER_MAP.md)**

Update WRITER_MAP when a KILL is removed or a SPINE becomes sole.

## Spine status (rollup)

Mirror of WRITER_MAP executive table. Re-verify in system packs—do not trust this table alone.

| Intent | Sole path? | Pack |
|--------|------------|------|
| B create | Likely yes | `02-systems/B-batches` |
| C feed | No | `02-systems/C-today-ops-feed` |
| C water | Partial | `02-systems/C-today-ops-water` |
| D care | No | `02-systems/D-care-health` |
| E feed plan/buy | No | `02-systems/E-feed-lab` |
| F stock | No | `02-systems/F-stock` |
| G eggs | Partial | `02-systems/G-eggs` |
| H mortality/sale | Likely yes | `02-systems/H-mortality-sales` |
| I terminate | Likely yes | `02-systems/I-terminate` |
| J jobs | Ops | `02-systems/J-jobs` |
| K hub/finance | Read + manual | `02-systems/K-dashboard-finance-records` |

## Structural CI goals (later)

- Grep ban: client insert into `expenses`/`feed_logs` from feed/stock/egg intent paths  
- Grep ban: `queueWrite('feed_logs'`  
- Optional: network assertion in live audit  

Do not claim CI until implemented.

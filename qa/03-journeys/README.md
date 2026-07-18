# Journeys A–K (orchestration)

System packs own **module depth**.  
Journey packs own **end-to-end farmer story** across modules.

Do not close a journey until **all systems it depends on** are at least `CURATED` for the intents touched—or greys explicitly deferred.

| Journey | Depends on systems | Pack |
|---------|-------------------|------|
| A Onboard | A | [A-onboard.md](A-onboard.md) |
| B Start flock | B | [B-start-flock.md](B-start-flock.md) |
| C Today ops | C-feed, C-water, K | [C-today-ops.md](C-today-ops.md) |
| D Care | D, B seed | [D-care.md](D-care.md) |
| E Plan/buy feed | E, F, C, K | [E-plan-buy-feed.md](E-plan-buy-feed.md) |
| F Stock | F, K | [F-stock.md](F-stock.md) |
| G Eggs | G, D, K | [G-eggs.md](G-eggs.md) |
| H Mort/sale | H, D, K | [H-mortality-sale.md](H-mortality-sale.md) |
| I Terminate | I, B | [I-terminate.md](I-terminate.md) |
| J Jobs | J | [J-jobs.md](J-jobs.md) |
| K Hub | K + producers | [K-hub.md](K-hub.md) |

## Full-day farmer path (integration)

After A–K system packs progress, run:

1. Onboard → create broiler intensive + duck flexible  
2. Stock purchase feed  
3. Day feed both systems  
4. Water both  
5. Complete care / vax  
6. Ready-made purchase then day feed (double-ledger)  
7. Mortality, attempt sale under withdrawal  
8. Finance reconcile  
9. Terminate spare flock  

Record in `qa/06-evidence/integration/`.

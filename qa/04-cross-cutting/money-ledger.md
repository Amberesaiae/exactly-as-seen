# Cross-cutting: money ledger

**Status:** **CURATED** (2026-07-17)

## Laws

- Pesewas only (`amount_pesewas`)  
- `source` + `source_ref` on auto ledger  
- No double expense same kg (purchase vs day feed skip; formulation windows DEFER)  
- Categories: 9 expense / 5 revenue CHECK  

## Re-proved

| Path | source | Pack |
|------|--------|------|
| Day feed | auto:feed | C |
| Water | auto:water | C-water |
| Care/vax | auto:health / auto:vaccination | D |
| Ready-made / formulation | auto:feed | E |
| Stock purchase | auto:stock | F |
| Egg sale | auto:eggs | G |
| Bird sale / terminate | bird_sale / auto:batch | H/I |
| Manual | manual | K |

## Residual

- E×C formulation vs day-feed allocation windows  

**Closed this session:** K9 stock usage atomic via `stock_usage` (tx + FIFO + qty).

Evidence: K-U04/U05 + producer packs + cross-cutting live + F K9 live
